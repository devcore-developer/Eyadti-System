// src/lib/actions/branches.ts

"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { branchCreateSchema, branchUpdateSchema } from "@/lib/validations/branch";
import { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/services/audit";
import { enforceUsageLimit } from "@/lib/services/usage-limits";

export async function getBranches() {
  const session = await auth();
  if (!session?.user?.clinicId) return [];

  return prisma.branch.findMany({
    where: { clinicId: session.user.clinicId },
    include: {
      manager: { select: { id: true, name: true } },
      _count: { select: { patients: true, appointments: true, doctorBranches: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createBranch(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Only admins can create branches" };
    }

    const raw = {
      name: formData.get("name") as string,
      code: (formData.get("code") as string)?.toUpperCase(),
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string || undefined,
      managerId: formData.get("managerId") as string || undefined,
    };

    const validated = branchCreateSchema.parse(raw);

    // Enforce SaaS Limit
    await enforceUsageLimit(session.user.clinicId, "BRANCHES");

    const existingCode = await prisma.branch.findFirst({
      where: { clinicId: session.user.clinicId, code: validated.code },
    });
    if (existingCode) return { success: false, error: "Branch code already exists" };

    const branch = await prisma.branch.create({
      data: {
        name: validated.name,
        code: validated.code,
        address: validated.address || null,
        city: validated.city || null,
        phone: validated.phone || null,
        email: validated.email || null,
        managerId: validated.managerId || null,
        clinicId: session.user.clinicId,
      },
    });

    await auditLog({
      clinicId: session.user.clinicId,
      userId: session.user.id,
      action: "CREATE",
      entityType: "BRANCH",
      entityId: branch.id,
      newValues: branch,
    });

    revalidatePath("/settings/branches");
    return { success: true };
  } catch (error: any) {
    if (error.name === "ZodError") {
      const messages = error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      console.error("🔴 Zod Validation Errors:", messages);
      return { success: false, error: messages };
    }
    if (error.message?.includes("limit")) {
      return { success: false, error: error.message };
    }
    console.error("🔴 Create Branch Error:", error);
    return { success: false, error: error.message || "Failed to create branch" };
  }
}

export async function updateBranch(branchId: string, formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const raw = {
      name: formData.get("name") as string,
      code: (formData.get("code") as string)?.toUpperCase(),
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string || undefined,
      managerId: formData.get("managerId") as string || undefined,
    };

    const validated = branchUpdateSchema.parse(raw);

    const existing = await prisma.branch.findFirst({
      where: { id: branchId, clinicId: session.user.clinicId },
    });
    if (!existing) return { success: false, error: "Branch not found" };

    const updated = await prisma.branch.update({
      where: { id: branchId },
      data: {
        name: validated.name,
        code: validated.code,
        address: validated.address || null,
        city: validated.city || null,
        phone: validated.phone || null,
        email: validated.email || null,
        managerId: validated.managerId || null,
      },
    });

    await auditLog({
      clinicId: session.user.clinicId,
      userId: session.user.id,
      action: "UPDATE",
      entityType: "BRANCH",
      entityId: branchId,
      oldValues: existing,
      newValues: updated,
    });

    revalidatePath("/settings/branches");
    return { success: true };
  } catch (error: any) {
    if (error.name === "ZodError") {
      const messages = error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(" | ");
      return { success: false, error: messages };
    }
    console.error("🔴 Update Branch Error:", error);
    return { success: false, error: error.message || "Failed to update branch" };
  }
}

export async function toggleBranchStatus(branchId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, clinicId: session.user.clinicId },
    });
    if (!branch) return { success: false, error: "Branch not found" };

    const updated = await prisma.branch.update({
      where: { id: branchId },
      data: { isActive: !branch.isActive },
    });

    await auditLog({
      clinicId: session.user.clinicId,
      userId: session.user.id,
      action: updated.isActive ? "ACTIVATE" : "DEACTIVATE",
      entityType: "BRANCH",
      entityId: branchId,
      oldValues: { isActive: branch.isActive },
      newValues: { isActive: updated.isActive },
    });

    revalidatePath("/settings/branches");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update branch status" };
  }
}

export async function deleteBranch(branchId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, clinicId: session.user.clinicId },
    });
    if (!branch) return { success: false, error: "Branch not found" };

    const patientCount = await prisma.patient.count({ where: { branchId } });
    if (patientCount > 0) {
      return { success: false, error: `Cannot delete: Branch has ${patientCount} patients. Deactivate it instead.` };
    }

    await prisma.branch.delete({ where: { id: branchId } });

    await auditLog({
      clinicId: session.user.clinicId,
      userId: session.user.id,
      action: "DELETE",
      entityType: "BRANCH",
      entityId: branchId,
      oldValues: branch,
    });

    revalidatePath("/settings/branches");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete branch" };
  }
}

// ─── Access Management ────────────────────────────────────────

export async function assignUserToBranches(
  userId: string,
  branchIds: string[],
  allBranchAccess: boolean
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { allBranchAccess },
    }),
    prisma.userBranch.deleteMany({ where: { userId } }),
    prisma.userBranch.createMany({
      data: branchIds.map((branchId) => ({ userId, branchId })),
      skipDuplicates: true,
    }),
  ]);

  revalidatePath("/settings/branches");
  return { success: true };
}

export async function assignDoctorToBranches(
  doctorId: string,
  branchIds: string[]
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.$transaction([
    prisma.doctorBranch.deleteMany({ where: { doctorId } }),
    prisma.doctorBranch.createMany({
      data: branchIds.map((branchId) => ({ doctorId, branchId })),
      skipDuplicates: true,
    }),
  ]);

  revalidatePath("/settings/branches");
  return { success: true };
}