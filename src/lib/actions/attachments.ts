// src/lib/actions/attachments.ts

"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import type { ActionResult } from "@/types"

// ── Constants ────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]

// ❌ تم مسح CATEGORY_LABELS و getCategoryLabel من هنا

// ── Zod Schema ───────────────────────────────────────

const AttachmentSchema = z.object({
  patientId: z.string().min(1),
  category: z.enum([
    "LAB_RESULT", "XRAY", "MRI", "CT_SCAN", "PRESCRIPTION", "MEDICAL_REPORT", "OTHER"
  ]),
})

// ── Upload Attachment ────────────────────────────────

export async function uploadAttachment(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.user.role)) {
    return { success: false, error: "Forbidden" }
  }

  const file = formData.get("file") as File | null
  const patientId = formData.get("patientId") as string
  const category = formData.get("category") as string

  if (!file || file.size === 0) {
    return { success: false, error: "No file selected" }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File size must be less than 10MB" }
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { success: false, error: "Only PDF, JPG, and PNG files are allowed" }
  }

  // Validate other fields
  const parsed = AttachmentSchema.safeParse({ patientId, category })
  if (!parsed.success) {
    return { success: false, error: "Invalid form data" }
  }

  // Verify patient belongs to clinic
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId: session.user.clinicId },
  })
  if (!patient) return { success: false, error: "Patient not found" }

  try {
    // Generate unique filename
    const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`
    
    // Create clinic-specific directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", session.user.clinicId)
    await mkdir(uploadDir, { recursive: true })
    
    // Write file to disk
    const filePath = path.join(uploadDir, uniqueName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Save record to database
    const fileUrl = `/uploads/${session.user.clinicId}/${uniqueName}`
    
    await prisma.attachment.create({
      data: {
        patientId: parsed.data.patientId,
        uploadedById: session.user.id,
        fileName: file.name,
        fileUrl,
        fileType: file.type,
        category: parsed.data.category,
        fileSize: file.size,
      },
    })

    revalidatePath(`/patients/${patientId}/attachments`)
    revalidatePath(`/patients/${patientId}`)
    return { success: true }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: "Failed to upload file" }
  }
}

// ── Delete Attachment ────────────────────────────────

export async function deleteAttachment(attachmentId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  if (!["ADMIN", "DOCTOR"].includes(session.user.role)) {
    return { success: false, error: "Forbidden" }
  }

  try {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId },
      include: { patient: { select: { id: true, clinicId: true } } },
    })
    if (!attachment) return { success: false, error: "Attachment not found" }
    if (attachment.patient.clinicId !== session.user.clinicId) {
      return { success: false, error: "Unauthorized" }
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), "public", attachment.fileUrl)
    try {
      await unlink(filePath)
    } catch {
      // File might already be deleted, ignore error
    }

    // Delete from database
    await prisma.attachment.delete({ where: { id: attachmentId } })

    revalidatePath(`/patients/${attachment.patientId}/attachments`)
    revalidatePath(`/patients/${attachment.patientId}`)
    return { success: true }
  } catch (error) {
    console.error("Delete error:", error)
    return { success: false, error: "Failed to delete attachment" }
  }
}

// ── Get Attachments by Patient ───────────────────────

export async function getAttachmentsByPatientId(patientId: string, clinicId: string) {
  // Verify patient belongs to clinic
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    select: { id: true },
  })
  if (!patient) return []

  return prisma.attachment.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { id: true, name: true } },
    },
  })
}