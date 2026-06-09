// src/lib/services/feature-gate.ts

import { FEATURES, type FeatureKey } from "@/lib/constants/features";
import { getSubscription } from "./subscription";
import { SubscriptionStatus } from "@prisma/client";

/**
 * Check if a clinic has access to a specific feature
 */
export async function hasFeature(
  clinicId: string,
  feature: FeatureKey
): Promise<boolean> {
  const subscription = await getSubscription(clinicId);
  if (!subscription) return false;

  const isActive = ([SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE] as SubscriptionStatus[]).includes(
    subscription.status
  );
  if (!isActive) return false;

  const featureConfig = FEATURES[feature];
  if (!featureConfig) return false;

  // MULTI_BRANCH تعتمد على العدد وليس Boolean
  if (feature === "MULTI_BRANCH") {
    return (
      subscription.plan.maxBranches === -1 || subscription.plan.maxBranches > 1
    );
  }

  const planKey = featureConfig.planField as keyof typeof subscription.plan;
  const value = subscription.plan[planKey];
  
  // لو القيمة Boolean، ارجعها. لو القيمة رقم، ارجع true لو أكبر من 0 أو -1
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === -1 || value > 0;
  
  return Boolean(value);
}

/**
 * Require a feature — throws if not available
 */
export async function requireFeature(
  clinicId: string,
  feature: FeatureKey
): Promise<void> {
  const hasAccess = await hasFeature(clinicId, feature);
  if (!hasAccess) {
    const featureConfig = FEATURES[feature];
    throw new Error(
      `Feature "${featureConfig.label}" is not available on your current plan. Please upgrade to access this feature.`
    );
  }
}

/**
 * Get all features for a clinic with their access status
 */
export async function getFeatureAccess(
  clinicId: string
): Promise<Record<FeatureKey, boolean>> {
  const result: Record<string, boolean> = {};

  for (const key of Object.keys(FEATURES) as FeatureKey[]) {
    result[key] = await hasFeature(clinicId, key);
  }

  return result as Record<FeatureKey, boolean>;
}