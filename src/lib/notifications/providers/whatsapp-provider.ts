import { NotificationChannel, NotificationPayload } from "../types"

export class WhatsAppProvider implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<boolean> {
    console.log(`[WhatsApp] To: ${payload.userId} - ${payload.message}`)
    return true
  }
}