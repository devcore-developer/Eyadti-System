export interface NotificationPayload {
  userId: string
  clinicId: string
  title: string
  message: string
  type: string
  priority?: string
  relatedEntityType?: string
  relatedEntityId?: string
}

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<boolean>
}