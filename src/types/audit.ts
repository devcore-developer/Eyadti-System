// src/types/audit.ts

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "CANCEL"
  | "PAID"
  | "UPGRADE"
  | "DOWNGRADE"
  | "ACTIVATE"     // ← تمت الإضافة
  | "DEACTIVATE";  // ← تمت الإضافة

export type EntityType =
  | "PATIENT"
  | "APPOINTMENT"
  | "VISIT"
  | "PRESCRIPTION"
  | "INVOICE"
  | "CLINIC_SETTINGS"
  | "USER"
  | "SUBSCRIPTION"
  | "BRANCH";

export interface AuditLogEntry {
  id: string;
  clinicId: string;
  userId: string | null;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  oldValues: any | null;
  newValues: any | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: { name: string; email: string } | null;
}

export interface AuditLogFilters {
  search?: string;
  action?: AuditAction | "";
  entityType?: EntityType | "";
  userId?: string | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export interface AuditLogPagination {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export const ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: "bg-emerald-100 text-emerald-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  CANCEL: "bg-orange-100 text-orange-800",
  PAID: "bg-teal-100 text-teal-800",
  UPGRADE: "bg-purple-100 text-purple-800",
  DOWNGRADE: "bg-gray-100 text-gray-800",
  ACTIVATE: "bg-green-100 text-green-800",       // ← تمت الإضافة
  DEACTIVATE: "bg-yellow-100 text-yellow-800",   // ← تمت الإضافة
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  PATIENT: "Patient",
  APPOINTMENT: "Appointment",
  VISIT: "Medical Record",
  PRESCRIPTION: "Prescription",
  INVOICE: "Invoice",
  CLINIC_SETTINGS: "Clinic Settings",
  USER: "User",
  SUBSCRIPTION: "Subscription",
  BRANCH: "Branch",
};