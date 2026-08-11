"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireRole } from "@/lib/permissions"
import { z } from "zod"
import type { ActionResult } from "@/types"
import { revalidatePath } from "next/cache"
import { Gender, VisitStatus, Priority, AppointmentType, AppointmentStatus } from "@prisma/client"
import { enforceUsageLimit } from "@/lib/services/usage-limits"
import { auditLog } from "@/lib/services/audit"
import { getClinicPaymentPolicy, isPreVisitPaymentRequired } from "@/lib/actions/payment-workflow"

const PatientVisitSchema = z.object({
  patientId: z.string().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().optional(),
  nationalId: z.string().optional(),
  doctorId: z.string().min(1, "Select a doctor"),
  visitDate: z.string().min(1, "Visit date is required"),
  visitType: z.string().optional(),
  notes: z.string().optional(),
  complaints: z.array(z.string()).optional(),
  diagnoses: z.array(z.string()).optional(),
  treatmentPlans: z.array(z.string()).optional(),
})

function safeJsonParse(str: string | null): string[] {
  if (!str) return []
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ══════════════════════════════════════════════════════════════
// FIXED: Generate unique queue number with proper filtering
// Uses aggregate for atomic max calculation
// Must be called INSIDE a transaction with tx parameter
// ══════════════════════════════════════════════════════════════

async function generateQueueNumber(clinicId: string, tx: any): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const result = await tx.visit.aggregate({
    where: { 
      clinicId, 
      createdAt: { 
        gte: today,
        lt: tomorrow 
      },
      queueNumber: { not: null }
    },
    _max: { queueNumber: true }
  })

  return (result._max.queueNumber || 0) + 1
}

async function resolveDictionaryIds(
  type: 'complaint' | 'diagnosis',
  names: string[]
): Promise<string[]> {
  if (!names || names.length === 0) return []
  const uniqueNames = [...new Set(names)]
  const existingMap = new Map<string, string>()

  if (type === 'complaint') {
    const existing = await prisma.complaint.findMany({
      where: { name: { in: uniqueNames } },
      select: { name: true, id: true }
    })
    existing.forEach(r => existingMap.set(r.name, r.id))
    const missingNames = uniqueNames.filter(n => !existingMap.has(n))
    if (missingNames.length > 0) {
      await prisma.complaint.createMany({ data: missingNames.map(name => ({ name })) })
      const createdRecords = await prisma.complaint.findMany({
        where: { name: { in: missingNames } },
        select: { name: true, id: true }
      })
      createdRecords.forEach(r => existingMap.set(r.name, r.id))
    }
  } else if (type === 'diagnosis') {
    const existing = await prisma.diagnosis.findMany({
      where: { name: { in: uniqueNames } },
      select: { name: true, id: true }
    })
    existing.forEach(r => existingMap.set(r.name, r.id))
    const missingNames = uniqueNames.filter(n => !existingMap.has(n))
    if (missingNames.length > 0) {
      await prisma.diagnosis.createMany({ data: missingNames.map(name => ({ name, icd10Code: null })) })
      const createdRecords = await prisma.diagnosis.findMany({
        where: { name: { in: missingNames } },
        select: { name: true, id: true }
      })
      createdRecords.forEach(r => existingMap.set(r.name, r.id))
    }
  }
  return names.map(name => existingMap.get(name)!)
}

// ══════════════════════════════════════════════════════════════
// HELPER: Determine if a date is "today"
// ══════════════════════════════════════════════════════════════

function isToday(dateStr: string): boolean {
  const today = new Date()
  const date = new Date(dateStr)
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}

// ══════════════════════════════════════════════════════════════
// CREATE PATIENT VISIT — FIXED: Always creates Appointment
// ══════════════════════════════════════════════════════════════

export async function createPatientVisit(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) {
    return { success: false, error: "Forbidden" }
  }

  const clinicId = session.user.clinicId
  const patientId = (formData.get("patientId") as string) || ""
  const isNewPatient = !patientId
  const isEmergency = (formData.get("isEmergency") as string) === "true"

  if (isNewPatient) {
    const name = formData.get("fullName") as string
    const phone = formData.get("phone") as string
    if (!name || !phone) return { success: false, error: "Name and Phone are required for new patients" }
  }

  const raw = {
    patientId,
    fullName: (formData.get("fullName") as string) || "",
    phone: (formData.get("phone") as string) || "",
    gender: (formData.get("gender") as string) || undefined,
    dateOfBirth: (formData.get("dateOfBirth") as string) || "",
    nationalId: (formData.get("nationalId") as string) || "",
    doctorId: (formData.get("doctorId") as string) || "",
    visitDate: (formData.get("visitDate") as string) || "",
    visitType: (formData.get("visitType") as string) || "",
    notes: (formData.get("notes") as string) || "",
    complaints: safeJsonParse(formData.get("complaints") as string),
    diagnoses: safeJsonParse(formData.get("diagnoses") as string),
    treatmentPlans: safeJsonParse(formData.get("treatmentPlans") as string),
  }

  const parsed = PatientVisitSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = Object.values(fieldErrors).flat()[0] || "Validation failed"
    return { success: false, error: firstError, fieldErrors: fieldErrors as Record<string, string[]> }
  }

  try {
    await enforceUsageLimit(clinicId, "MONTHLY_VISITS")
    if (isNewPatient) {
      await enforceUsageLimit(clinicId, "PATIENTS")
    }

    const [complaintIds, diagnosisIds, treatmentIds] = await Promise.all([
      resolveDictionaryIds('complaint', parsed.data.complaints || []),
      resolveDictionaryIds('diagnosis', parsed.data.diagnoses || []),
      Promise.all((parsed.data.treatmentPlans || []).map(async (title) => {
        const template = await prisma.treatmentTemplate.findFirst({ where: { title } })
        return template?.id || null
      }))
    ])

    // ── Determine appointment type and whether to create visit immediately ──
    const visitIsToday = isToday(parsed.data.visitDate)
    const paymentPolicy = await getClinicPaymentPolicy(clinicId)
    const requiresPrePayment = await isPreVisitPaymentRequired(clinicId)
    // Note: emergencies also get visits immediately
    const createVisitImmediately = visitIsToday && (isEmergency || !requiresPrePayment)

    const result = await prisma.$transaction(async (tx) => {
      let currentPatientId = parsed.data.patientId!

      // ── Create patient if new ──
      if (isNewPatient) {
        const newPatient = await tx.patient.create({
          data: {
            fullName: parsed.data.fullName!,
            phone: parsed.data.phone!,
            gender: (parsed.data.gender || "MALE") as Gender,
            dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : new Date("1990-01-01"),
            address: parsed.data.nationalId || null,
            clinicId,
          }
        })
        currentPatientId = newPatient.id
      }

      // ══════════════════════════════════════════════════
      // FIX: Always create an Appointment
      // ══════════════════════════════════════════════════
      const appointmentType = isEmergency
        ? AppointmentType.EMERGENCY
        : (visitIsToday ? AppointmentType.WALK_IN : AppointmentType.SCHEDULED)

      const appointmentNotes = parsed.data.visitType
        ? `[${parsed.data.visitType}] ${parsed.data.notes || ''}`.trim()
        : parsed.data.notes || null

      const appointmentDateTime = visitIsToday
        ? new Date()
        : new Date(parsed.data.visitDate)

      const appointment = await tx.appointment.create({
        data: {
          patientId: currentPatientId,
          doctorId: parsed.data.doctorId,
          clinicId,
          dateTime: appointmentDateTime,
          notes: appointmentNotes,
          type: appointmentType,
          status: createVisitImmediately ? AppointmentStatus.CONFIRMED : AppointmentStatus.SCHEDULED,
        }
      })

      // ── Create visit only if conditions are met ──
      let visit = null
      if (createVisitImmediately) {
        const queueNumber = await generateQueueNumber(clinicId, tx)
        const visitNotes = parsed.data.visitType
          ? `[${parsed.data.visitType}] ${parsed.data.notes || ''}`.trim()
          : parsed.data.notes || null

        visit = await tx.visit.create({
          data: {
            clinicId,
            patientId: currentPatientId,
            doctorId: parsed.data.doctorId,
            appointmentId: appointment.id,
            visitDate: new Date(parsed.data.visitDate),
            notes: visitNotes,
            status: VisitStatus.WAITING,
            queueNumber,
            priority: isEmergency ? Priority.URGENT : Priority.MEDIUM,
            checkedInAt: new Date(),
          },
        })

        // Attach clinical data to the visit
        if (complaintIds.length > 0) {
          await tx.visitComplaint.createMany({
            data: complaintIds.map(complaintId => ({ visitId: visit!.id, complaintId })) as any
          })
        }
        if (diagnosisIds.length > 0) {
          await tx.visitDiagnosis.createMany({
            data: diagnosisIds.map(diagnosisId => ({ visitId: visit!.id, diagnosisId })) as any
          })
        }
        const validTreatmentIds = treatmentIds.filter((id): id is string => id !== null)
        if (validTreatmentIds.length > 0) {
          await tx.visitTreatmentPlan.createMany({
            data: validTreatmentIds.map(treatmentId => ({ visitId: visit!.id, treatmentId })) as any
          })
        }
      }

      return { appointment, visit, patientId: currentPatientId }
    })

    revalidatePath(`/patients/${result.patientId}/visits`)
    revalidatePath(`/patients`)
    revalidatePath(`/waiting-room`)
    revalidatePath(`/appointments`)

    return {
      success: true,
      patientId: result.patientId,
      appointmentId: result.appointment.id,
      visitId: result.visit?.id,
      visitCreated: !!result.visit,
      requiresPayment: !createVisitImmediately && requiresPrePayment,
      paymentPolicy: !createVisitImmediately && requiresPrePayment ? (paymentPolicy as string) : undefined,
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("limit")) {
      return { success: false, error: error.message }
    }
    console.error("Visit creation error:", error)
    return { success: false, error: (error as Error).message || "Failed to create visit" }
  }
}

// ══════════════════════════════════════════════════════════════
// UPDATE VISIT (unchanged)
// ══════════════════════════════════════════════════════════════

export async function updateVisit(visitId: string, formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR"].includes(session.user.role)) return { success: false, error: "Forbidden" }

  const raw = {
    patientId: (formData.get("patientId") as string) || "",
    doctorId: (formData.get("doctorId") as string) || "",
    visitDate: (formData.get("visitDate") as string) || "",
    notes: (formData.get("notes") as string) || "",
    complaints: safeJsonParse(formData.get("complaints") as string),
    diagnoses: safeJsonParse(formData.get("diagnoses") as string),
    treatmentPlans: safeJsonParse(formData.get("treatmentPlans") as string),
  }

  const parsed = PatientVisitSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = fieldErrors.doctorId?.[0] || fieldErrors.visitDate?.[0] || "Validation failed"
    return { success: false, error: firstError, fieldErrors: fieldErrors as Record<string, string[]> }
  }

  try {
    const existing = await prisma.visit.findFirst({ where: { id: visitId, clinicId: session.user.clinicId } })
    if (!existing) return { success: false, error: "Visit not found" }
    if (session.user.role === "DOCTOR" && existing.doctorId !== session.user.id) {
      return { success: false, error: "You can only edit your own visits" }
    }

    const [complaintIds, diagnosisIds, treatmentIds] = await Promise.all([
      resolveDictionaryIds('complaint', parsed.data.complaints || []),
      resolveDictionaryIds('diagnosis', parsed.data.diagnoses || []),
      Promise.all((parsed.data.treatmentPlans || []).map(async (title) => {
        const template = await prisma.treatmentTemplate.findFirst({ where: { title } })
        return template?.id || null
      }))
    ])

    await prisma.$transaction(async (tx) => {
      await tx.visit.update({
        where: { id: visitId },
        data: {
          doctorId: parsed.data.doctorId,
          visitDate: new Date(parsed.data.visitDate),
          notes: parsed.data.notes || null,
        },
      })
      await tx.visitComplaint.deleteMany({ where: { visitId } })
      await tx.visitDiagnosis.deleteMany({ where: { visitId } })
      await tx.visitTreatmentPlan.deleteMany({ where: { visitId } })
      if (complaintIds.length > 0) {
        await tx.visitComplaint.createMany({ data: complaintIds.map(complaintId => ({ visitId, complaintId })) as any })
      }
      if (diagnosisIds.length > 0) {
        await tx.visitDiagnosis.createMany({ data: diagnosisIds.map(diagnosisId => ({ visitId, diagnosisId })) as any })
      }
      const validTreatmentIds = treatmentIds.filter((id): id is string => id !== null)
      if (validTreatmentIds.length > 0) {
        await tx.visitTreatmentPlan.createMany({ data: validTreatmentIds.map(treatmentId => ({ visitId, treatmentId })) as any })
      }
    })

    revalidatePath(`/patients/${parsed.data.patientId}/visits`)
    revalidatePath(`/patients/${parsed.data.patientId}/visits/${visitId}`)
    return { success: true }
  } catch (error) {
    console.error("DB error:", error)
    return { success: false, error: "Failed to update visit" }
  }
}

// ══════════════════════════════════════════════════════════════
// DELETE VISIT (unchanged)
// ══════════════════════════════════════════════════════════════

export async function deleteVisit(visitId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR"].includes(session.user.role)) return { success: false, error: "Forbidden" }

  try {
    const visit = await prisma.visit.findFirst({
      where: { id: visitId, clinicId: session.user.clinicId },
      select: { id: true, doctorId: true, patientId: true },
    })
    if (!visit) return { success: false, error: "Visit not found" }
    if (session.user.role === "DOCTOR" && visit.doctorId !== session.user.id) {
      return { success: false, error: "You can only delete your own visits" }
    }

    await prisma.visit.delete({ where: { id: visitId } })
    revalidatePath(`/patients/${visit.patientId}/visits`)
    revalidatePath(`/patients/${visit.patientId}`)
    return { success: true }
  } catch (error) {
    console.error("DB error:", error)
    return { success: false, error: "Failed to delete visit" }
  }
}

// ══════════════════════════════════════════════════════════════
// COMPLETE PRE-VISIT CHECK-IN
// FIXED: Re-verifies payment before creating Visit.
// If partial payment doesn't satisfy clinic policy,
// returns PAYMENT_REQUIRED so frontend can re-open dialog.
// ══════════════════════════════════════════════════════════════

export async function completePreVisitCheckIn(data: {
  appointmentId: string
  isEmergency: boolean
}): Promise<ActionResult & { visitId?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
    return { success: false, error: "Forbidden" }
  }

  const clinicId = session.user.clinicId

  try {
    const appointment = await prisma.appointment.findFirst({
      where: { id: data.appointmentId, clinicId },
      select: { 
        id: true, 
        patientId: true, 
        doctorId: true, 
        dateTime: true,
        notes: true,
        status: true
      }
    })
    
    if (!appointment) {
      return { success: false, error: "Appointment not found" }
    }
    
    const existingVisit = await prisma.visit.findFirst({
      where: { appointmentId: data.appointmentId }
    })
    if (existingVisit) {
      return { success: false, error: "Visit already exists for this appointment" }
    }

    // ═══ CRITICAL FIX: Re-verify payment before creating Visit ═══
    const { verifyPreVisitPayment } = await import("@/lib/actions/payment-workflow")
    const verification = await verifyPreVisitPayment(data.appointmentId)
    
    if (!verification.allowed) {
      return {
        success: false,
        error: "PAYMENT_REQUIRED",
        paymentRequired: true,
        paymentStatus: verification.paymentStatus,
      }
    }
    
    const result = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: data.appointmentId },
        data: { status: AppointmentStatus.CONFIRMED }
      })
      
      const queueNumber = await generateQueueNumber(clinicId, tx)
      
      const visit = await tx.visit.create({
        data: {
          clinicId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          appointmentId: appointment.id,
          visitDate: appointment.dateTime,
          notes: appointment.notes,
          status: VisitStatus.WAITING,
          queueNumber,
          priority: data.isEmergency ? Priority.URGENT : Priority.MEDIUM,
          checkedInAt: new Date(),
        }
      })
      
      return visit
    })
    
    await auditLog({
      clinicId,
      userId: session.user.id,
      action: "CHECK_IN" as any,
      entityType: "VISIT",
      entityId: result.id,
      newValues: { 
        appointmentId: data.appointmentId, 
        queueNumber: result.queueNumber,
        isEmergency: data.isEmergency 
      }
    })
    
    revalidatePath("/waiting-room")
    revalidatePath("/appointments")
    revalidatePath(`/patients/${appointment.patientId}/visits`)
    
    return { success: true, visitId: result.id }
  } catch (error: any) {
    console.error("Pre-visit check-in error:", error)
    return { success: false, error: error.message || "Failed to complete check-in." }
  }
}

// ══════════════════════════════════════════════════════════════
// DATA FETCHING (unchanged)
// ══════════════════════════════════════════════════════════════

export async function getVisitsByPatientId(patientId: string, _unsafeClinicId?: string) {
  try {
    const { clinicId } = await requireRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST")
    return prisma.visit.findMany({
      where: { patientId, clinicId },
      orderBy: { visitDate: "desc" },
      include: {
        doctor: { select: { id: true, name: true } },
        appointment: { select: { id: true, dateTime: true, type: true, status: true } },
        _count: { select: { complaints: true, diagnoses: true } },
      },
    })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return []
    return []
  }
}

export async function getVisitById(visitId: string, _unsafeClinicId?: string) {
  try {
    const { clinicId } = await requireRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST")
    return prisma.visit.findFirst({
      where: { id: visitId, clinicId },
      include: {
        patient: { select: { id: true, fullName: true } },
        doctor: { select: { id: true, name: true } },
        appointment: { select: { id: true, dateTime: true, type: true, status: true } },
        complaints: { include: { complaint: true } } as any,
        diagnoses: { include: { diagnosis: true } } as any,
        treatmentPlans: true,
        prescription: { include: { items: true } },
      },
    })
  } catch (error: any) {
    if (error.name === "AuthorizationError") return null
    return null
  }
}