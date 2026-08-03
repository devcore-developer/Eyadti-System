import { prisma } from "@/lib/db"

/**
 * إرسال إشعار للسوبر أدمن
 * يمكن استدعاؤها من أي Server Action أو Service
 */
export async function notifySuperAdmin(
  type: string, 
  title: string, 
  message: string, 
  clinicId?: string, 
  actionUrl?: string
) {
  try {
    // لو مفيش clinicId صالح، نستخدم أول عيادة موجودة
    let validClinicId = clinicId
    if (!validClinicId) {
      const firstClinic = await prisma.clinic.findFirst({ select: { id: true } })
      validClinicId = firstClinic?.id || undefined
    }

    await prisma.superAdminNotification.create({
      data: { type, title, message, clinicId: validClinicId, actionUrl }
    })
  } catch (error) {
    // لا نوقف العملية الرئيسية لو فشل الإشعار
    console.error("Failed to create super admin notification:", error)
  }
}

/**
 * الإشعارات الجاهزة — كل حالة بإسم/type موحد
 */

export async function notifyNewClinicRegistered(clinicId: string, clinicName: string, ownerName: string) {
  await notifySuperAdmin(
    "CLINIC_REGISTERED",
    "New Clinic Registered",
    `${clinicName} registered by ${ownerName}.`,
    clinicId,
    `/super-admin/clinics/${clinicId}`
  )
}

export async function notifyTrialExpired(clinicId: string, clinicName: string) {
  await notifySuperAdmin(
    "TRIAL_EXPIRED",
    "Trial Period Expired",
    `${clinicName}'s trial has ended. No action taken yet.`,
    clinicId,
    `/super-admin/clinics/${clinicId}`
  )
}

export async function notifyPaymentFailed(clinicId: string, clinicName: string, amount: number, reason?: string) {
  await notifySuperAdmin(
    "PAYMENT_FAILED",
    "Payment Failed",
    `${clinicName}: ${amount} EGP payment failed.${reason ? ` Reason: ${reason}` : ""}`,
    clinicId,
    `/super-admin/clinics/${clinicId}`
  )
}

export async function notifySystemWarning(service: string, status: string, details: string) {
  await notifySuperAdmin(
    "SYSTEM_WARNING",
    `System Warning: ${service}`,
    `${service} is ${status}. ${details}`,
    undefined,
    "/super-admin/system-health"
  )
}

export async function notifySystemCritical(service: string, details: string) {
  await notifySuperAdmin(
    "SYSTEM_CRITICAL",
    `Critical: ${service} Down`,
    `${service} is unresponsive. ${details}`,
    undefined,
    "/super-admin/system-health"
  )
}

export async function notifySuspiciousActivity(
  clinicId: string | undefined,
  title: string, 
  description: string, 
  actionUrl?: string
) {
  await notifySuperAdmin(
    "SUSPICIOUS_ACTIVITY",
    title,
    description,
    clinicId,
    actionUrl
  )
}