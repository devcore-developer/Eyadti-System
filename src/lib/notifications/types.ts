export interface NotificationPayload {
  userId: string;
  clinicId: string;
  title: string;
  message: string;
  externalMessage?: string;
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  relatedEntityType?: string;
  relatedEntityId?: string;
  patientPhone?: string | null; // ← عدلناها بقى تقبل null
}

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<boolean>;
}