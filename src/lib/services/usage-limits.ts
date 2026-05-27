// src/lib/services/usage-limits.ts
import { prisma } from "@/lib/db";
import { ResourceKey, UsageCheckResult, UsageStat } from "@/types/subscription";
import { RESOURCE_CONFIG } from "@/lib/constants/features";
import { getSubscription } from "./subscription";

async function getCurrentUsage(clinicId: string, resource: ResourceKey): Promise<number> {
  switch (resource) {
    case "DOCTORS":
      return prisma.user.count({ where: { clinicId, role: "DOCTOR" } });
    case "USERS":
      return prisma.user.count({ where: { clinicId } });
    case "PATIENTS":
      return prisma.patient.count({ where: { clinicId } });
    case "BRANCHES":
      // بناءً على الـ Schema الحالي مفيش Model مستقلة للـ Branches، فبنعتبر العيادة الواحدة هي 1
      return 1;
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
  };
  const val = map[resource];
  // في الـ Schema بتاعك: -1 يعني Unlimited، فبنحوله لـ null
  if (val === -1 || val === null || val === undefined) return null; 
  return val;
}

export async function checkUsageLimit(clinicId: string, resource: ResourceKey): Promise<UsageCheckResult> {
  const subscription = await getSubscription(clinicId);
  if (!subscription) {
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
  const result = await checkUsageLimit(clinicId, resource);
  if (!result.allowed) {
    const config = RESOURCE_CONFIG[resource];
    const limitText = result.limit !== null ? `${result.limit} ${config.label.toLowerCase()}` : "unlimited";
    throw new Error(`You have reached the ${limitText} limit on your current plan. Please upgrade to add more ${config.label.toLowerCase()}.`);
  }
}

export async function getUsageStats(clinicId: string): Promise<UsageStat[]> {
  const subscription = await getSubscription(clinicId);
  if (!subscription) return [];

  const resources: ResourceKey[] = ["DOCTORS", "USERS", "PATIENTS", "BRANCHES"];
  const stats: UsageStat[] = [];

  for (const resource of resources) {
    const current = await getCurrentUsage(clinicId, resource);
    const limit = getPlanLimit(subscription.plan, resource);
    const config = RESOURCE_CONFIG[resource];
    stats.push({ resource, current, limit, label: config.label, icon: config.icon });
  }

  return stats;
}