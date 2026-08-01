"use server"

import { prisma } from "@/lib/db"
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/permissions"
import { createUserSchema, updateUserSchema, updateClinicSchema } from "@/lib/validations/admin"
import type { ActionResult } from "@/types"
import { hashPassword } from "@/lib/password"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"

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
      image: (formData.get("image") as string) || "",
      specialty: (formData.get("specialty") as string) || "",
      degree: (formData.get("degree") as string) || "",
      branchIds: formData.getAll("branchIds") as string[],
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

    const clinicExists = await prisma.clinic.findUnique({ where: { id: session.clinicId } })
    if (!clinicExists) {
      return { success: false, error: "Clinic not found. Please log out and log in again to refresh your session." }
    }

    // FIX #25: Use hashPassword for consistent salt rounds (12)
    const hashedPassword = await hashPassword(validated.data.password)

    const newUser = await prisma.user.create({
      data: {
        name: validated.data.name,
        email: validated.data.email,
        password: hashedPassword,
        role: validated.data.role,
        clinicId: session.clinicId,
        image: validated.data.image || null,
        specialty: validated.data.specialty || null,
        degree: validated.data.degree || null,
      },
    })

    if (validated.data.branchIds && validated.data.branchIds.length > 0) {
      if (validated.data.role === Role.DOCTOR) {
        await prisma.doctorBranch.createMany({
          data: validated.data.branchIds.map(branchId => ({
            doctorId: newUser.id,
            branchId,
          })),
        })
      } else {
        await prisma.userBranch.createMany({
          data: validated.data.branchIds.map(branchId => ({
            userId: newUser.id,
            branchId,
          })),
        })
      }
    }
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
      image: (formData.get("image") as string) || "",
      specialty: (formData.get("specialty") as string) || "",
      degree: (formData.get("degree") as string) || "",
      branchIds: formData.getAll("branchIds") as string[],
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
      image: validated.data.image || null,
      specialty: validated.data.specialty || null,
      degree: validated.data.degree || null,
    }

    if (validated.data.password && validated.data.password.trim() !== "") {
      // FIX #25: Use hashPassword for consistent salt rounds (12)
      updateData.password = await hashPassword(validated.data.password)
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    if (validated.data.branchIds) {
      if (validated.data.role === Role.DOCTOR) {
        await prisma.$transaction([
          prisma.doctorBranch.deleteMany({ where: { doctorId: userId } }),
          prisma.doctorBranch.createMany({
            data: validated.data.branchIds.map(branchId => ({
              doctorId: userId,
              branchId,
            })),
          }),
        ])
      } else {
        await prisma.$transaction([
          prisma.userBranch.deleteMany({ where: { userId } }),
          prisma.userBranch.createMany({
            data: validated.data.branchIds.map(branchId => ({
              userId,
              branchId,
            })),
          }),
        ])
      }
    }
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

    // FIX #26: Generate slug from name when name changes
    const newSlug = validated.data.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + "-" + session.clinicId.substring(0, 6)

    await prisma.clinic.update({
      where: { id: session.clinicId },
      data: {
        name: validated.data.name.trim(),
        slug: newSlug,
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