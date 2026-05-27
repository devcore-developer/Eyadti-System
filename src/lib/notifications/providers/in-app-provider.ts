import { prisma } from "@/lib/db"
import { NotificationChannel, NotificationPayload } from "../types"

export class InAppProvider implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<boolean> {
    try {
      console.log("🔔 Creating notification:", payload.title, "for user:", payload.userId)
      
      await prisma.notification.create({
        data: {
          clinicId: payload.clinicId,
          userId: payload.userId,
          title: payload.title,
          message: payload.message,
          type: payload.type as any,
          priority: (payload.priority as any) || "MEDIUM",
          relatedEntityType: payload.relatedEntityType,
          relatedEntityId: payload.relatedEntityId,
        },
      })
      
      console.log("✅ Notification created successfully!")
      return true
    } catch (error) {
      console.error("❌ InAppProvider error:", error)
      return false
    }
  }
}