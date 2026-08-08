import type { Role } from "@prisma/client"

// صلاحيات الريسبشن (ممنوعة من المالي وإدارة المستخدمين)
const RECEPTIONIST_PERMISSIONS = [
  "appointment:create",
  "appointment:view",
  "appointment:check_in",
  "patient:create",
  "patient:view",
  "visit:view",
  "waiting-room:manage",
  "online-booking:manage",
  "schedule:manage",
  "settings:account",
]

// صلاحيات الدكتور (ممنوع من الـ Billing والمالي وإدارة المستخدمين والحجوزات الأونلاين)
const DOCTOR_PERMISSIONS = [
  "appointment:view",
  "patient:view",
  "visit:create",
  "visit:view",
  "visit:edit",
  "visit:change_status",
  "prescription:create",
  "prescription:view",
  "prescription:edit",
  "report:upload",
  "schedule:view_own",
  "settings:account",
]

// صلاحيات الأدمن (كل شيء)
const ADMIN_PERMISSIONS = [
  "appointment:create",
  "appointment:view",
  "appointment:check_in",
  "appointment:cancel",
  "patient:create",
  "patient:view",
  "patient:edit",
  "patient:delete",
  "visit:create",
  "visit:view",
  "visit:edit",
  "visit:change_status",
  "prescription:create",
  "prescription:view",
  "prescription:edit",
  "invoice:create",
  "invoice:view",
  "invoice:edit",
  "revenue:view",
  "user:manage",
  "subscription:manage",
  "settings:manage",
  "settings:clinic",
  "online-booking:manage",
  "schedule:manage",
  "settings:account",
]

const PERMISSIONS_MAP: Record<Role, string[]> = {
  SUPER_ADMIN: ADMIN_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  DOCTOR: DOCTOR_PERMISSIONS,
  RECEPTIONIST: RECEPTIONIST_PERMISSIONS,
}

export function hasPermission(role: string, permission: string): boolean {
  return (PERMISSIONS_MAP[role as Role] ?? []).includes(permission)
}