import { NotificationChannel, NotificationPayload } from "../types"

export class EmailProvider implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<boolean> {
    console.log(`[Email] To: ${payload.userId} - ${payload.message}`)
    return true
  }
}