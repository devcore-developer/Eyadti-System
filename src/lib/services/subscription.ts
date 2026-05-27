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
    },
    include: { plan: true },
  });

  return subscription as SubscriptionType;
}

export async function getSubscription(
  clinicId: string
): Promise<SubscriptionType | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { clinicId },
    include: { plan: true },
  });

  if (!subscription) return null;

  // Auto-expire trial if ended
  if (
    subscription.status === SubscriptionStatus.TRIAL &&
    subscription.trialEndsAt &&
    new Date() > subscription.trialEndsAt
  ) {
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.EXPIRED },
      include: { plan: true },
    });
    return updated as SubscriptionType;
  }

  // Auto-expire active subscription if end date passed
  if (
    subscription.status === SubscriptionStatus.ACTIVE &&
    subscription.endDate &&
    new Date() > subscription.endDate
  ) {
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.EXPIRED },
      include: { plan: true },
    });
    return updated as SubscriptionType;
  }

  return subscription as SubscriptionType;
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

export async function activateSubscription(
  clinicId: string,
  planId: string,
  billingCycle: "MONTHLY" | "YEARLY"
): Promise<SubscriptionType> {
  const now = new Date();
  const endDate = new Date(now);

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
        cancelledAt: null,
      },
      include: { plan: true },
    });
    return updated as SubscriptionType;
  }

  const subscription = await prisma.subscription.create({
    data: {
      clinicId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      endDate,
    },
    include: { plan: true },
  });

  return subscription as SubscriptionType;
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

  return subscription as SubscriptionType;
}

export async function suspendSubscription(
  subscriptionId: string
): Promise<SubscriptionType> {
  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: SubscriptionStatus.SUSPENDED },
    include: { plan: true },
  });

  return subscription as SubscriptionType;
}

export async function reactivateSubscription(
  subscriptionId: string,
  planId: string,
  billingCycle: "MONTHLY" | "YEARLY"
): Promise<SubscriptionType> {
  const now = new Date();
  const endDate = new Date(now);

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
      cancelledAt: null,
    },
    include: { plan: true },
  });

  return subscription as SubscriptionType;
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