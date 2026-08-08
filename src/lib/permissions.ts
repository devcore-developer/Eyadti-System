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

  // لو هو SUPER_ADMIN، ادخله على طول في أي عملية من غير فحص
  if (session.user.role === "SUPER_ADMIN") {
    return {
      clinicId: session.user.clinicId,
      userId: session.user.id,
      role: session.user.role,
    }
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

// ── Financial Access Guard ───────────────────────────
// الدكتور والريسبشن محظورين من البيانات المالية

export async function requireFinancialAccess() {
  const session = await auth()
  if (!session?.user) throw new AuthenticationError()

  if (session.user.role === "SUPER_ADMIN") {
    return { clinicId: session.user.clinicId, userId: session.user.id, role: session.user.role }
  }

  if (session.user.role === "DOCTOR" || session.user.role === "RECEPTIONIST") {
    throw new AuthorizationError("You do not have access to financial data.")
  }

  return { clinicId: session.user.clinicId, userId: session.user.id, role: session.user.role }
}

// ── Online Booking Management Guard ──────────────────
// الدكتور محظور من إدارة الحجوزات الأونلاين

export async function requireOnlineBookingAccess() {
  const session = await auth()
  if (!session?.user) throw new AuthenticationError()

  if (session.user.role === "SUPER_ADMIN") {
    return { clinicId: session.user.clinicId, userId: session.user.id, role: session.user.role }
  }

  if (session.user.role === "DOCTOR") {
    throw new AuthorizationError("You do not have access to online booking management.")
  }

  return { clinicId: session.user.clinicId, userId: session.user.id, role: session.user.role }
}

// ── Schedule Management Guard ────────────────────────
// الدكتور يشوف جدوله فقط، ما يقدر يعدله

export async function requireScheduleManagement() {
  const session = await auth()
  if (!session?.user) throw new AuthenticationError()

  if (session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "RECEPTIONIST") {
    return { clinicId: session.user.clinicId, userId: session.user.id, role: session.user.role }
  }

  if (session.user.role === "DOCTOR") {
    throw new AuthorizationError("Doctors cannot modify clinic schedules.")
  }

  throw new AuthorizationError()
}

// ── User Management Guard ────────────────────────────
// الأدمن فقط يقدر يدير المستخدمين

export async function requireUserManagement() {
  const session = await auth()
  if (!session?.user) throw new AuthenticationError()

  if (session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN") {
    return { clinicId: session.user.clinicId, userId: session.user.id, role: session.user.role }
  }

  throw new AuthorizationError("You do not have access to user management.")
}

// ── Clinic Settings Guard ────────────────────────────
// الدكتور والريسبشن محظورين من إعدادات العيادة

export async function requireClinicSettingsAccess() {
  const session = await auth()
  if (!session?.user) throw new AuthenticationError()

  if (session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN") {
    return { clinicId: session.user.clinicId, userId: session.user.id, role: session.user.role }
  }

  throw new AuthorizationError("You do not have access to clinic settings.")
}

// ── Patient Permissions ──────────────────────────────

export function canCreatePatient(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "DOCTOR" || role === "RECEPTIONIST"
}

export function canEditPatient(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "DOCTOR"
}

export function canDeletePatient(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN"
}