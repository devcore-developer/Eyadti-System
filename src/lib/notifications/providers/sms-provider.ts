import { NotificationChannel, NotificationPayload } from "../types"

export class SMSProvider implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<boolean> {
    console.log(`[SMS] To: ${payload.userId} - ${payload.message}`)
    return true
  }
}