import { prisma } from "@/lib/db";
import { RESOURCE_CONFIG, type ResourceKey, type UsageCheckResult, type UsageStat } from "@/lib/constants/features";
import { getSubscription } from "./subscription";
import { SubscriptionStatus } from "@prisma/client";

async function getCurrentUsage(clinicId: string, resource: ResourceKey): Promise<number> {
  switch (resource) {
    case "DOCTORS":
      return prisma.user.count({ where: { clinicId, role: "DOCTOR" } });
    case "USERS":
      return prisma.user.count({ where: { clinicId } });
    case "PATIENTS":
      return prisma.patient.count({ where: { clinicId } });
    case "BRANCHES":
      return prisma.branch.count({ where: { clinicId } });
    case "MONTHLY_VISITS": {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return prisma.visit.count({
        where: {
          clinicId,
          visitDate: { gte: firstDayOfMonth },
        },
      });
    }
    default:
      return 0;
  }
}

function getPlanLimit(plan: any, resource: ResourceKey): number | null {
  const map: Record<ResourceKey, number> = {
    DOCTORS: plan.maxDoctors,
    USERS: plan.maxUsers,
    PATIENTS: plan.maxPatients,
    BRANCHES: plan.maxBranches,
    MONTHLY_VISITS: plan.maxMonthlyVisits,
  };
  const val = map[resource];
  if (val === -1 || val === null || val === undefined) return null;
  return val;
}

export async function checkUsageLimit(clinicId: string, resource: ResourceKey): Promise<UsageCheckResult> {
  const subscription = await getSubscription(clinicId);
  if (!subscription) {
    return { allowed: false, current: 0, limit: 0, remaining: 0 };
  }

  if (
    subscription.status !== SubscriptionStatus.TRIAL &&
    subscription.status !== SubscriptionStatus.ACTIVE
  ) {
    return { allowed: false, current: 0, limit: 0, remaining: 0 };
  }

  const current = await getCurrentUsage(clinicId, resource);
  const limit = getPlanLimit(subscription.plan, resource);

  if (limit === null) {
    return { allowed: true, current, limit: null, remaining: null };
  }

  const remaining = Math.max(0, limit - current);
  return { allowed: current < limit, current, limit, remaining };
}

export async function enforceUsageLimit(clinicId: string, resource: ResourceKey): Promise<void> {
  const subscription = await getSubscription(clinicId);
  if (!subscription) {
    throw new Error("Subscription not found. Please contact support.");
  }

  if (
    subscription.status !== SubscriptionStatus.TRIAL &&
    subscription.status !== SubscriptionStatus.ACTIVE
  ) {
    throw new Error("Your subscription is not active. Please renew your plan to continue.");
  }

  const current = await getCurrentUsage(clinicId, resource);
  const limit = getPlanLimit(subscription.plan, resource);

  if (limit === null) return; // Unlimited plan

  if (current >= limit) {
    const config = RESOURCE_CONFIG[resource];
    const planName = subscription.plan.name || "current";
    throw new Error(
      `${config.label} limit reached. Your ${planName} plan allows a maximum of ${limit} ${config.label.toLowerCase()}. Please upgrade your plan to add more ${config.singular}.`
    );
  }
}

export async function getUsageStats(clinicId: string): Promise<UsageStat[]> {
  const subscription = await getSubscription(clinicId);
  if (!subscription) return [];

  // ═══════════════════════════════════════════════════════════
  // ✅ FIX: Removed "DOCTORS" from display — no separate quota
  // Doctors are counted as part of USERS
  // ═══════════════════════════════════════════════════════════
  const resources: ResourceKey[] = ["USERS", "PATIENTS", "BRANCHES", "MONTHLY_VISITS"];
  const stats: UsageStat[] = [];

  for (const resource of resources) {
    const current = await getCurrentUsage(clinicId, resource);
    const limit = getPlanLimit(subscription.plan, resource);
    const config = RESOURCE_CONFIG[resource];
    stats.push({ resource, current, limit, label: config.label, icon: config.icon });
  }

  return stats;
}