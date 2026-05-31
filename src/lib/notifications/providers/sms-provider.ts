import { NotificationChannel, NotificationPayload } from "../types"

export class SMSProvider implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<boolean> {
    if (!payload.patientPhone) {
      console.log(`[SMS] Skipped: No phone number for patient.`)
      return false
    }

    const apiUrl = process.env.SMS_API_URL
    const apiKey = process.env.SMS_API_KEY

    if (!apiUrl || !apiKey) {
      console.log(`[SMS - Dev Mode] To: ${payload.patientPhone} - ${payload.message}`)
      return true
    }

    try {
      // Example: Generic SMS API Integration
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          to: payload.patientPhone,
          message: payload.message,
          sender: process.env.SMS_SENDER_ID || "Eyadti" // اسم المرسل المعتمد
        }),
      })

      if (!response.ok) {
        console.error(`[SMS] Failed to send to ${payload.patientPhone}`)
        return false
      }

      console.log(`[SMS] ✅ Message sent to ${payload.patientPhone}`)
      return true
    } catch (error) {
      console.error("[SMS] Network error:", error)
      return false
    }
  }
}