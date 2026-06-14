import type { Role } from "@prisma/client"

// ✨ صلاحيات الريسبشن (ممنوعة من الحذف والتعديل الطبي)
const RECEPTIONIST_PERMISSIONS = [
  "appointment:create", "appointment:view", "appointment:check_in",
  "patient:create", "patient:view",
  "visit:view", // يرى الزيارات في غرفة الانتظار فقط
  "invoice:create", "invoice:view",
  "waiting-room:manage"
]

// ✨ صلاحيات الدكتور (ممنوع من الـ Billing وإدارة المستخدمين)
const DOCTOR_PERMISSIONS = [
  "appointment:view",
  "patient:view",
  "visit:create", "visit:view", "visit:edit", "visit:change_status", // يقدر يكمل الـ Workflow
  "prescription:create", "prescription:view", "prescription:edit",
  "report:upload"
]

// ✨ صلاحيات الأدمن (كل شيء ماعدا حذف السجلات الطبية أحياناً)
const ADMIN_PERMISSIONS = [
  "appointment:create", "appointment:view", "appointment:check_in", "appointment:cancel",
  "patient:create", "patient:view", "patient:edit", "patient:delete",
  "visit:create", "visit:view", "visit:edit", "visit:change_status",
  "prescription:create", "prescription:view", "prescription:edit",
  "invoice:create", "invoice:view", "invoice:edit",
  "user:manage", "subscription:manage", "settings:manage"
]

const PERMISSIONS_MAP: Record<Role, string[]> = {
  SUPER_ADMIN: ADMIN_PERMISSIONS, // يأخذ صلاحيات الأدمن
  ADMIN: ADMIN_PERMISSIONS,
  DOCTOR: DOCTOR_PERMISSIONS,
  RECEPTIONIST: RECEPTIONIST_PERMISSIONS,
}

export function hasPermission(role: string, permission: string): boolean {
  return (PERMISSIONS_MAP[role as Role] ?? []).includes(permission)
}