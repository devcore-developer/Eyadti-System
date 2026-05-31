import { NotificationChannel, NotificationPayload } from "../types"

export class WhatsAppProvider implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<boolean> {
    if (!payload.patientPhone) {
      console.log(`[WhatsApp] Skipped: No phone number for patient.`)
      return false
    }

    const accessToken = process.env.META_WHATSAPP_TOKEN
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      console.log(`[WhatsApp - Dev Mode] To: ${payload.patientPhone} - ${payload.externalMessage || payload.message}`)
      return true // بيشتغل في السيرفر كأنه ببعت، بس مبيبعتش حاجة حقيقية
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: payload.patientPhone, // لازم يبقى 201012345678+
            type: "text",
            text: { 
              body: payload.externalMessage || payload.message 
            },
          }),
        }
      )

      const data = await response.json()
      
      if (data.error) {
        console.error(`[WhatsApp] ❌ Error sending to ${payload.patientPhone}:`, data.error.message)
        return false
      }

      console.log(`[WhatsApp] ✅ Message sent to ${payload.patientPhone}`)
      return true
    } catch (error) {
      console.error("[WhatsApp] Network error:", error)
      return false
    }
  }
}
