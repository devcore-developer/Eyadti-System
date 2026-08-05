import { prisma } from "@/lib/db"
import { InAppProvider } from "./providers/in-app-provider"
import { WhatsAppProvider } from "./providers/whatsapp-provider"
import { SMSProvider } from "./providers/sms-provider"
import { NotificationPayload } from "./types"

const inAppProvider = new InAppProvider()
const whatsappProvider = new WhatsAppProvider()
const smsProvider = new SMSProvider()

export async function dispatchNotification(payload: NotificationPayload) {
  // ⭐ لو الإشعارات مقفولة في الـ clinic settings، متبعتش حاجة
  if (payload.clinicId) {
    const settings = await prisma.clinicSettings.findUnique({
      where: { clinicId: payload.clinicId },
      select: { enableNotifications: true },
    })
    if (settings && !settings.enableNotifications) return
  }

  // 1. ابعت إشعار داخل النظام
  await inAppProvider.send(payload)

  // 2. لو الحدث يخص المريض، ابعتله واتساب
  const patientEvents = ["APPOINTMENT_CREATED", "APPOINTMENT_REMINDER", "APPOINTMENT_CANCELLED"]
  
  if (patientEvents.includes(payload.type) && payload.patientPhone) {
    await whatsappProvider.send(payload)
  }
}