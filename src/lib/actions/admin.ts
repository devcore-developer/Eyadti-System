// src/actions/admin.ts
"use server"

import { prisma } from "@/lib/db"
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/permissions"
import { createUserSchema, updateUserSchema, updateClinicSchema } from "@/lib/validations/admin"
import type { ActionResult } from "@/types"
import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"

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

    // التأكد إن الإيميل مش مستخدم قبل كده
    const existingUser = await prisma.user.findUnique({ where: { email: validated.data.email } })
    if (existingUser) {
      return { success: false, error: "Email is already in use." }
    }

    // Hash الباسورد
    const hashedPassword = await hash(validated.data.password, 10)

    await prisma.user.create({
      data: {
        name: validated.data.name,
        email: validated.data.email,
        password: hashedPassword,
        role: validated.data.role,
        clinicId: session.clinicId, // الأدمن بيضيف في عيادته بس
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

    // التأكد إن اليوزر ده تبع نفس العيادة
    const existingUser = await prisma.user.findFirst({
      where: { id: userId, clinicId: session.clinicId },
    })
    if (!existingUser) return { success: false, error: "User not found in your clinic." }

    // منع الأدمن إنه يشيل نفسه من الـ Admin (عشان ميقفلش على نفسه)
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

    // بناء الـ Data اللي هتتحدث (لو مفيش باسورد جديد، م نحدثش الباسورد القديم)
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

    // التأكد إن الأدمن بيعدل عيادته هو بس
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
  revalidatePath("/dashboard") // عشان الاسم يتحدث في الـ Sidebar
  return { success: true }
}