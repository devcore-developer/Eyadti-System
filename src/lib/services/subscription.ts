// src/lib/services/subscription.ts

import { prisma } from "@/lib/db";
import { SubscriptionStatus } from "@prisma/client";
import {
  TRIAL_DURATION_DAYS,
  DEFAULT_TRIAL_PLAN_SLUG,
} from "@/lib/constants/features";
import { SubscriptionType } from "@/types/subscription";

export async function createTrialSubscription(
  clinicId: string
): Promise<SubscriptionType> {
  const plan = await prisma.plan.findFirst({
    where: { slug: DEFAULT_TRIAL_PLAN_SLUG, active: true },
  });

  if (!plan) {
    throw new Error(
      `Default trial plan "${DEFAULT_TRIAL_PLAN_SLUG}" not found. Run seed first.`
    );
  }

  const now = new Date();
  const trialEndsAt = new Date(now);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

  const subscription = await prisma.subscription.create({
    data: {
      clinicId,
      planId: plan.id,
      status: SubscriptionStatus.TRIAL,
      startDate: now,
      trialEndsAt,
      amountPaid: 0, // Trial = no payment
      billingCycle: "MONTHLY",
    },
    include: { plan: true },
  });

  return subscription as any;
}

/**
 * Get subscription for a clinic (READ ONLY — no side effects).
 */
export async function getSubscription(
  clinicId: string
): Promise<SubscriptionType | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { clinicId },
    include: { plan: true },
  });

  if (!subscription) return null;

  return subscription as unknown as SubscriptionType;
}

export async function isSubscriptionActive(clinicId: string): Promise<boolean> {
  const subscription = await getSubscription(clinicId);
  if (!subscription) return false;
  
  return (
    subscription.status === SubscriptionStatus.TRIAL ||
    subscription.status === SubscriptionStatus.ACTIVE
  );
}

export function getTrialDaysRemaining(trialEndsAt: Date | null): number | null {
  if (!trialEndsAt) return null;
  const now = new Date();
  const diff = trialEndsAt.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

/**
 * Activate subscription and store the ACTUAL amount paid.
 * This amount is used for revenue calculations, NOT the current plan price.
 */
export async function activateSubscription(
  clinicId: string,
  planId: string,
  billingCycle: "MONTHLY" | "YEARLY"
): Promise<SubscriptionType> {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plan not found");

  const now = new Date();
  const endDate = new Date(now);

  // Calculate the amount ACTUALLY paid at time of activation
  const amountPaid = billingCycle === "MONTHLY" ? plan.monthlyPrice : plan.yearlyPrice;

  if (billingCycle === "MONTHLY") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const existing = await prisma.subscription.findUnique({
    where: { clinicId },
  });

  if (existing) {
    const updated = await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        endDate,
        currentPeriodEnd: endDate,
        cancelledAt: null,
        amountPaid,
        billingCycle,
      },
      include: { plan: true },
    });
    return updated as any;
  }

  const subscription = await prisma.subscription.create({
    data: {
      clinicId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      endDate,
      currentPeriodEnd: endDate,
      amountPaid,
      billingCycle,
    },
    include: { plan: true },
  });

  return subscription as any;
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<SubscriptionType> {
  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
    },
    include: { plan: true },
  });

  return subscription as any;
}

export async function suspendSubscription(
  subscriptionId: string
): Promise<SubscriptionType> {
  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: SubscriptionStatus.SUSPENDED },
    include: { plan: true },
  });

  return subscription as any;
}

export async function reactivateSubscription(
  subscriptionId: string,
  planId: string,
  billingCycle: "MONTHLY" | "YEARLY"
): Promise<SubscriptionType> {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plan not found");

  const now = new Date();
  const endDate = new Date(now);
  const amountPaid = billingCycle === "MONTHLY" ? plan.monthlyPrice : plan.yearlyPrice;

  if (billingCycle === "MONTHLY") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      planId,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      endDate,
      currentPeriodEnd: endDate,
      cancelledAt: null,
      amountPaid,
      billingCycle,
    },
    include: { plan: true },
  });

  return subscription as any;
}

export async function getActivePlans() {
  return prisma.plan.findMany({
    where: { active: true },
    orderBy: { monthlyPrice: "asc" },
  });
}

export async function getAllPlans() {
  const plans = await prisma.plan.findMany({
    orderBy: { monthlyPrice: "asc" },
    include: {
      _count: {
        select: { subscriptions: true },
      },
    },
  });

  return plans.map((p) => ({
    ...p,
    subscriptionCount: p._count.subscriptions,
  }));
}

export async function getPlanById(id: string) {
  return prisma.plan.findUnique({ where: { id } });
}

export async function getPlanBySlug(slug: string) {
  return prisma.plan.findUnique({ where: { slug } });
}