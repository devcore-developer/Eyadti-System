"use server"

import { prisma } from "@/lib/db"
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/permissions"
import { createUserSchema, updateUserSchema, updateClinicSchema } from "@/lib/validations/admin"
import type { ActionResult } from "@/types"
import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

function handleAuthError(error: unknown): ActionResult {
  if (error instanceof AuthenticationError) return { success: false, error: error.message }
  if (error instanceof AuthorizationError) return { success: false, error: error.message }
  return { success: false, error: "An unexpected error occurred" }
}

// ─── Create User ──────────────────────────────────────────────────
export async function createUser(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN")

    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as string,
    }

    const validated = createUserSchema.safeParse(raw)
    if (!validated.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email: validated.data.email } })
    if (existingUser) {
      return { success: false, error: "Email is already in use." }
    }

    const hashedPassword = await hash(validated.data.password, 10)

    await prisma.user.create({
      data: {
        name: validated.data.name,
        email: validated.data.email,
        password: hashedPassword,
        role: validated.data.role,
        clinicId: session.clinicId,
      },
    })
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError" || (error as any)?.name === "AuthorizationError") {
      return handleAuthError(error)
    }
    console.error(error)
    return { success: false, error: "Failed to create user." }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

// ─── Update User ──────────────────────────────────────────────────
export async function updateUser(userId: string, formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN")

    const existingUser = await prisma.user.findFirst({
      where: { id: userId, clinicId: session.clinicId },
    })
    if (!existingUser) return { success: false, error: "User not found in your clinic." }

    if (existingUser.id === session.userId && formData.get("role") !== "ADMIN") {
      return { success: false, error: "You cannot remove your own Admin role." }
    }

    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      password: (formData.get("password") as string) || "",
    }

    const validated = updateUserSchema.safeParse(raw)
    if (!validated.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const updateData: any = {
      name: validated.data.name,
      email: validated.data.email,
      role: validated.data.role,
    }

    if (validated.data.password && validated.data.password.trim() !== "") {
      updateData.password = await hash(validated.data.password, 10)
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError" || (error as any)?.name === "AuthorizationError") {
      return handleAuthError(error)
    }
    console.error(error)
    return { success: false, error: "Failed to update user." }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

// ─── Update Clinic Settings ────────────────────────────────────────
export async function updateClinicSettings(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN")

    const raw = {
      name: formData.get("name") as string,
      phone: (formData.get("phone") as string) || "",
      address: (formData.get("address") as string) || "",
    }

    const validated = updateClinicSchema.safeParse(raw)
    if (!validated.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    await prisma.clinic.update({
      where: { id: session.clinicId },
      data: {
        name: validated.data.name.trim(),
        phone: validated.data.phone?.trim() || null,
        address: validated.data.address?.trim() || null,
      },
    })
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError" || (error as any)?.name === "AuthorizationError") {
      return handleAuthError(error)
    }
    console.error(error)
    return { success: false, error: "Failed to update clinic settings." }
  }

  revalidatePath("/admin/settings")
  revalidatePath("/dashboard")
  return { success: true }
}

// ─── Generate Activation Code ────────────────────────────
export async function generateActivationCode(type: "SIGNUP" | "SUBSCRIPTION", durationDays: number): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN")

    // توليد كود عشوائي (مثلا: F4A1-B9C2)
    const rawCode = crypto.randomBytes(4).toString("hex").toUpperCase()
    const formattedCode = `${rawCode.slice(0, 4)}-${rawCode.slice(4)}`
    
    // لو الكود لتسجيل، دايماً بيدي 3 أيام تجربة. لو لتفعيل، بيستخدم الـ durationDays
    const days = type === "SIGNUP" ? 3 : durationDays

    await prisma.activationCode.create({
      data: {
        code: formattedCode,
        type: type,
        durationDays: days,
      },
    })

    return { success: true, message: `${type === "SIGNUP" ? "Signup" : "Subscription"} code generated: ${formattedCode}` }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to generate code." }
  }
}