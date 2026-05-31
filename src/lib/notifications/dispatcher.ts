import { InAppProvider } from "./providers/in-app-provider"
import { WhatsAppProvider } from "./providers/whatsapp-provider"
import { SMSProvider } from "./providers/sms-provider"
import { NotificationPayload } from "./types"

const inAppProvider = new InAppProvider()
const whatsappProvider = new WhatsAppProvider()
const smsProvider = new SMSProvider()

export async function dispatchNotification(payload: NotificationPayload) {
  // 1. دايماً ابعت إشعار داخل النظام للأدمن/الدكتور
  await inAppProvider.send(payload)

  // 2. لو الحدث يخص المريض (زي حجز معاد)، ابعتله واتساب
  const patientEvents = ["APPOINTMENT_CREATED", "APPOINTMENT_REMINDER", "APPOINTMENT_CANCELLED"]
  
  if (patientEvents.includes(payload.type) && payload.patientPhone) {
    // ممكن تخليه يبعت SMS كمان لو الواتساب فشل، بس هسيبك تتحكم في ده
    await whatsappProvider.send(payload)
  }
}