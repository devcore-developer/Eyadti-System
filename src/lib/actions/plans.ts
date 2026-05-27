"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createPlanSchema,
  updatePlanSchema,
  archivePlanSchema,
} from "@/lib/validations/subscription";
import { ActionResult } from "@/types";

export async function createPlan(
  formData: unknown
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createPlanSchema.parse(formData);

    const existing = await prisma.plan.findUnique({
      where: { slug: validated.slug },
    });
    if (existing) {
      return { success: false, error: "A plan with this slug already exists" };
    }

    await prisma.plan.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description || null,
        monthlyPrice: validated.monthlyPrice,
        yearlyPrice: validated.yearlyPrice,
        maxDoctors: validated.maxDoctors ?? -1,
        maxUsers: validated.maxUsers ?? -1,
        maxPatients: validated.maxPatients ?? -1,
        maxBranches: validated.maxBranches ?? -1,
        onlineBookingEnabled: validated.onlineBookingEnabled,
        analyticsEnabled: validated.analyticsEnabled,
        notificationsEnabled: validated.notificationsEnabled,
        active: validated.active,
      },
    });

    revalidatePath("/admin/plans");
    return { success: true, error: undefined };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors.map((e: any) => e.message).join(", "),
      };
    }
    return { success: false, error: "Failed to create plan" };
  }
}

export async function updatePlan(
  formData: unknown
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updatePlanSchema.parse(formData);

    const existing = await prisma.plan.findUnique({
      where: { id: validated.id },
    });
    if (!existing) {
      return { success: false, error: "Plan not found" };
    }

    if (validated.slug && validated.slug !== existing.slug) {
      const slugExists = await prisma.plan.findUnique({
        where: { slug: validated.slug },
      });
      if (slugExists) {
        return { success: false, error: "A plan with this slug already exists" };
      }
    }

    await prisma.plan.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        monthlyPrice: validated.monthlyPrice,
        yearlyPrice: validated.yearlyPrice,
        maxDoctors: validated.maxDoctors ?? -1,
        maxUsers: validated.maxUsers ?? -1,
        maxPatients: validated.maxPatients ?? -1,
        maxBranches: validated.maxBranches ?? -1,
        onlineBookingEnabled: validated.onlineBookingEnabled,
        analyticsEnabled: validated.analyticsEnabled,
        notificationsEnabled: validated.notificationsEnabled,
        active: validated.active,
      },
    });

    revalidatePath("/admin/plans");
    return { success: true, error: undefined };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors.map((e: any) => e.message).join(", "),
      };
    }
    return { success: false, error: "Failed to update plan" };
  }
}

export async function archivePlan(
  formData: unknown
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const validated = archivePlanSchema.parse(formData);

    const activeSubscriptions = await prisma.subscription.count({
      where: {
        planId: validated.id,
        status: { in: ["TRIAL", "ACTIVE"] },
      },
    });

    if (activeSubscriptions > 0 && !validated.active) {
      return {
        success: false,
        error: `Cannot archive: ${activeSubscriptions} active subscription(s) use this plan`,
      };
    }

    await prisma.plan.update({
      where: { id: validated.id },
      data: { active: validated.active },
    });

    revalidatePath("/admin/plans");
    return { success: true, error: undefined };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors.map((e: any) => e.message).join(", "),
      };
    }
    return { success: false, error: "Failed to update plan status" };
  }
}

export async function deletePlan(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const subscriptions = await prisma.subscription.count({
      where: { planId: id },
    });

    if (subscriptions > 0) {
      return {
        success: false,
        error: `Cannot delete: ${subscriptions} subscription(s) reference this plan. Archive it instead.`,
      };
    }

    await prisma.plan.delete({ where: { id } });

    revalidatePath("/admin/plans");
    return { success: true, error: undefined };
  } catch (error) {
    return { success: false, error: "Failed to delete plan" };
  }
}