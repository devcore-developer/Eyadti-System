import { z } from "zod"

export const notificationSettingsSchema = z.object({
  enableInApp: z.boolean(),
  enableEmail: z.boolean(),
  enableSMS: z.boolean(),
  enableWhatsApp: z.boolean(),
  appointmentReminders: z.boolean(),
  invoiceNotifications: z.boolean(),
  systemNotifications: z.boolean(),
})

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>