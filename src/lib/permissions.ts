import { auth } from "@/lib/auth"

// ── Custom Error Classes ─────────────────────────────

export class AuthenticationError extends Error {
  constructor(message: string = "Not authenticated") {
    super(message)
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Not authorized") {
    super(message)
    this.name = "AuthorizationError"
  }
}

// ── Role Check Helper ────────────────────────────────

export async function requireRole(...roles: string[]) {
  const session = await auth()
  
  if (!session?.user) {
    throw new AuthenticationError()
  }
  
  if (!roles.includes(session.user.role)) {
    throw new AuthorizationError()
  }
  
  return {
    clinicId: session.user.clinicId,
    userId: session.user.id,
    role: session.user.role,
  }
}

// ── Patient Permissions ──────────────────────────────

export function canCreatePatient(role: string): boolean {
  return role === "ADMIN" || role === "RECEPTIONIST"
}

export function canEditPatient(role: string): boolean {
  return role === "ADMIN" || role === "DOCTOR"
}

export function canDeletePatient(role: string): boolean {
  return role === "ADMIN"
}