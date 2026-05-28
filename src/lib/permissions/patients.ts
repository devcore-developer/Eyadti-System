// src/lib/permissions/patients.ts
import type { Role } from "@prisma/client"

type PatientPermission = "view" | "create" | "edit" | "delete"

const PERMISSIONS: Record<Role, PatientPermission[]> = {
  SUPER_ADMIN: ["view", "create", "edit", "delete"], // ← أضفنا السطر ده
  ADMIN: ["view", "create", "edit", "delete"],
  DOCTOR: ["view", "edit"],
  RECEPTIONIST: ["view"],
};

export function hasPatientPermission(role: string, permission: PatientPermission): boolean {
  return (PERMISSIONS[role as Role] ?? []).includes(permission)
}

export function canViewPatient(role: string): boolean {
  return hasPatientPermission(role, "view")
}

export function canCreatePatient(role: string): boolean {
  return hasPatientPermission(role, "create")
}

export function canEditPatient(role: string): boolean {
  return hasPatientPermission(role, "edit")
}

export function canDeletePatient(role: string): boolean {
  return hasPatientPermission(role, "delete")
}