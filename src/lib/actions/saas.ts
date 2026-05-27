// src/lib/actions/saas.ts
"use server";

import { prisma } from "@/lib/db";
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/permissions";
import { createPlanSchema, updateSubscriptionSchema } from "@/lib/validations/subscription";
import { SubscriptionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

function handleAuthError(error: unknown) {
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    throw error; // Re-throw to be caught by the caller
  }
  throw new Error("An unexpected error occurred");
}

// Helper to convert null to undefined for Prisma compatibility
function stripNulls<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, value ?? undefined])
  ) as T;
}

// ─── PLAN MANAGEMENT (Super Admin Only) ──────────────────
export async function createPlan(values: unknown) {
  try {
    await requireRole("ADMIN");
    const validated = createPlanSchema.parse(values);
    
    // التأكد إن الـ Slug مش موجود
    const existing = await prisma.plan.findUnique({ where: { slug: validated.slug } });
    if (existing) throw new Error("Plan slug already exists");

    // تحويل null إلى undefined لتجنب خطأ Prisma
    const cleanData = stripNulls(validated);
    return await prisma.plan.create({ data: cleanData as any });
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}

export async function updatePlan(planId: string, values: unknown) {
  try {
    await requireRole("ADMIN");
    const validated = createPlanSchema.partial().parse(values);
    
    // تحويل null إلى undefined لتجنب خطأ Prisma
    const cleanData = stripNulls(validated);
    return await prisma.plan.update({ where: { id: planId }, data: cleanData as any });
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}

export async function togglePlanStatus(planId: string, active: boolean) {
  try {
    await requireRole("ADMIN");
    const updated = await prisma.plan.update({ where: { id: planId }, data: { active } });
    revalidatePath("/admin/plans");
    return updated;
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}

// ─── SUBSCRIPTION MANAGEMENT (Clinic Admin/Owner) ────────
export async function updateSubscription(values: unknown) {
  try {
    const session = await requireRole("ADMIN"); // يمكن تطويرها لتشمل OWNER
    const { planId, billingCycle } = updateSubscriptionSchema.parse(values);

    // استخدام clinicId من الـ session بدلاً من الـ values
    const clinicId = session.clinicId;

    const currentSub = await prisma.subscription.findUnique({ where: { clinicId } });
    if (!currentSub) throw new Error("No subscription found");

    const now = new Date();
    const endDate = new Date(now);
    if (billingCycle === "MONTHLY") endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    const updated = await prisma.subscription.update({
      where: { id: currentSub.id },
      data: {
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        endDate,
        cancelledAt: null,
      },
    });

    revalidatePath("/settings/billing");
    revalidatePath("/settings/subscriptions");
    return updated;
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}

export async function cancelMySubscription() {
  try {
    const session = await requireRole("ADMIN");
    
    await prisma.subscription.update({
      where: { clinicId: session.clinicId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    revalidatePath("/settings/billing");
    return { success: true };
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}