// lib/notifications/types.ts

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

// ✅ FIXED: Complete route mapping with correct expectations
// PRESCRIPTION and VISIT now expect patientId as relatedEntityId
export function getNotificationRoute(entityType?: string, entityId?: string): string {
  if (!entityType || !entityId) return "/notifications";
  
  const routes: Record<string, string> = {
    // entityId = appointmentId
    APPOINTMENT: `/appointments/${entityId}`,
    
    // entityId = patientId
    PATIENT: `/patients/${entityId}`,
    
    // entityId = invoiceId
    INVOICE: `/invoices/${entityId}`,
    
    // ✅ FIXED: entityId = patientId (changed from prescriptionId)
    PRESCRIPTION: `/patients/${entityId}/prescriptions`,
    
    // ✅ FIXED: entityId = patientId (changed from visitId)
    VISIT: `/patients/${entityId}/visits`,
    
    // ✅ ADDED: Online booking goes to appointment
    ONLINE_BOOKING: `/appointments/${entityId}`,
    
    // ✅ ADDED: Announcement has no entity, go to announcements page
    ANNOUNCEMENT: `/super-admin/announcements`,
    
    // ✅ ADDED: Subscription goes to billing
    SUBSCRIPTION: `/settings/billing`,
    
    // ✅ ADDED: System notifications stay on notifications page
    SYSTEM: "/notifications",
    
    // ✅ ADDED: Waiting room
    WAITING_ROOM: "/waiting-room",
  };

  return routes[entityType] || "/notifications";
}