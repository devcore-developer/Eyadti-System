// src/actions/admin.ts - استبدل دالة createUser بالكامل

"use server"

import { prisma } from "@/lib/db"
import { requireRole, requireSelfEdit, AuthenticationError, AuthorizationError } from "@/lib/permissions"
import { createUserSchema, updateUserSchema, updateClinicSchema } from "@/lib/validations/admin"
import type { ActionResult } from "@/types"
import { hashPassword } from "@/lib/password"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"
import { enforceUsageLimit } from "@/lib/services/usage-limits"

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

    // ═══════════════════════════════════════════════════════════
    // ✅ FIX: Enforce USERS limit only — no separate DOCTORS quota
    // Doctors are regular users counted against the total user limit
    // ═══════════════════════════════════════════════════════════
    await enforceUsageLimit(session.clinicId, "USERS")
    // ❌ REMOVED: Separate doctor quota check
    // if (validated.data.role === Role.DOCTOR) {
    //   await enforceUsageLimit(session.clinicId, "DOCTORS")
    // }

    const hashedPassword = await hashPassword(validated.data.password)

    const isAdminRole = validated.data.role === Role.ADMIN

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: validated.data.name,
          email: validated.data.email,
          password: hashedPassword,
          role: validated.data.role,
          clinicId: session.clinicId,
          image: validated.data.image || null,
          specialty: validated.data.specialty || null,
          degree: validated.data.degree || null,
          allBranchAccess: isAdminRole,
        },
      })

      if (!isAdminRole && validated.data.branchIds && validated.data.branchIds.length > 0) {
        const validBranches = await tx.branch.findMany({
          where: { id: { in: validated.data.branchIds }, clinicId: session.clinicId }
        })
        if (validBranches.length !== validated.data.branchIds.length) {
          throw new Error("Invalid branch selection. You can only assign branches belonging to your clinic.")
        }

        if (validated.data.role === Role.DOCTOR) {
          await tx.doctorBranch.createMany({
            data: validated.data.branchIds.map(branchId => ({
              doctorId: newUser.id,
              branchId,
            })),
          })
        } else {
          await tx.userBranch.createMany({
            data: validated.data.branchIds.map(branchId => ({
              userId: newUser.id,
              branchId,
            })),
          })
        }
      }
    })
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError" || (error as any)?.name === "AuthorizationError") {
      return handleAuthError(error)
    }
    if (error instanceof Error && (error.message.includes("limit") || error.message.includes("Invalid branch"))) {
      return { success: false, error: error.message }
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
    let session: Awaited<ReturnType<typeof requireRole>>
    let isSelfEdit = false

    try {
      session = await requireRole("ADMIN")
    } catch (error) {
      if (error instanceof AuthorizationError) {
        session = await requireSelfEdit()
        isSelfEdit = true
      } else {
        throw error
      }
    }

    if (isSelfEdit && userId !== session.userId) {
      return { success: false, error: "You can only update your own profile." }
    }

    const existingUser = await prisma.user.findFirst({
      where: { id: userId, clinicId: session.clinicId },
    })
    if (!existingUser) return { success: false, error: "User not found in your clinic." }

    if (!isSelfEdit && existingUser.id === session.userId && formData.get("role") !== "ADMIN") {
      return { success: false, error: "You cannot remove your own Admin role." }
    }

    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: (formData.get("role") as string) || existingUser.role,
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

    const newRole = validated.data.role || existingUser.role
    const isNewRoleAdmin = newRole === Role.ADMIN

    const updateData: any = {
      name: validated.data.name,
      email: validated.data.email,
      image: validated.data.image || null,
      specialty: validated.data.specialty || null,
      degree: validated.data.degree || null,
      allBranchAccess: isNewRoleAdmin,
    }

    if (!isSelfEdit) {
      updateData.role = newRole
    }

    if (validated.data.password && validated.data.password.trim() !== "") {
      updateData.password = await hashPassword(validated.data.password)
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: updateData,
      })

      if (!isSelfEdit && validated.data.branchIds) {
        if (newRole === Role.DOCTOR) {
          await tx.doctorBranch.deleteMany({ where: { doctorId: userId } })
          
          if (!isNewRoleAdmin && validated.data.branchIds.length > 0) {
            const validBranches = await tx.branch.findMany({
              where: { id: { in: validated.data.branchIds }, clinicId: session.clinicId }
            })
            if (validBranches.length !== validated.data.branchIds.length) {
              throw new Error("Invalid branch selection.")
            }
            
            await tx.doctorBranch.createMany({
              data: validated.data.branchIds.map(branchId => ({
                doctorId: userId,
                branchId,
              })),
            })
          }
        } else {
          await tx.userBranch.deleteMany({ where: { userId } })
          
          if (!isNewRoleAdmin && validated.data.branchIds.length > 0) {
            const validBranches = await tx.branch.findMany({
              where: { id: { in: validated.data.branchIds }, clinicId: session.clinicId }
            })
            if (validBranches.length !== validated.data.branchIds.length) {
              throw new Error("Invalid branch selection.")
            }
            
            await tx.userBranch.createMany({
              data: validated.data.branchIds.map(branchId => ({
                userId,
                branchId,
              })),
            })
          }
        }
      }
    })
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError" || (error as any)?.name === "AuthorizationError") {
      return handleAuthError(error)
    }
    if (error instanceof Error && error.message.includes("Invalid branch")) {
      return { success: false, error: error.message }
    }
    console.error(error)
    return { success: false, error: "Failed to update user." }
  }

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/edit/${userId}`)
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

// ─── Delete User ──────────────────────────────────────────────────
export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN")

    if (session.userId === userId) {
      return { success: false, error: "You cannot delete your own account." }
    }

    const userToDelete = await prisma.user.findFirst({
      where: { id: userId, clinicId: session.clinicId },
    })

    if (!userToDelete) {
      return { success: false, error: "User not found in your clinic." }
    }

    if (userToDelete.role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      return { success: false, error: "Only Super Admins can delete other Super Admins." }
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2003') {
      return { 
        success: false, 
        error: "Cannot delete this user because they have associated records (e.g., appointments or invoices). Please reassign their records first." 
      }
    }
    if ((error as any)?.name === "AuthenticationError" || (error as any)?.name === "AuthorizationError") {
      return handleAuthError(error)
    }
    console.error(error)
    return { success: false, error: "Failed to delete user." }
  }
}