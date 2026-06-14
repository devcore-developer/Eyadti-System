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
  patientPhone?: string | null;
}

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<boolean>;
}

// ✨ دالة مساعدة لتحويل الإشعار إلى مسار قابل للنقر
export function getNotificationRoute(entityType?: string, entityId?: string): string {
  if (!entityType || !entityId) return "/notifications";
  
  const routes: Record<string, string> = {
    APPOINTMENT: `/appointments/${entityId}`,
    PATIENT: `/patients/${entityId}`,
    INVOICE: `/invoices/${entityId}`,
    PRESCRIPTION: `/patients/${entityId}/prescriptions`, // أو حسب الـ ID المحدد
    WAITING_ROOM: "/waiting-room",
    VISIT: `/patients/${entityId}/visits`,
  };

  return routes[entityType] || "/notifications";
}