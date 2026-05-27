// src/lib/services/feature-gate.ts

import { FeatureKey } from "@/types/subscription";
import { FEATURES } from "@/lib/constants/features";
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

  if (feature === "MULTI_BRANCH") {
    return (
      subscription.plan.maxBranches === null || subscription.plan.maxBranches > 1
    );
  }

  const planKey = featureConfig.planField as keyof typeof subscription.plan;
  return Boolean(subscription.plan[planKey]);
}

/**
 * Get all features for a clinic with their access status
 */
export async function getFeatureAccess(
  clinicId: string
): Promise<Record<FeatureKey, boolean>> {
  const subscription = await getSubscription(clinicId);
  const result: Record<string, boolean> = {};

  for (const key of Object.keys(FEATURES) as FeatureKey[]) {
    if (!subscription) {
      result[key] = false;
      continue;
    }
    result[key] = await hasFeature(clinicId, key);
  }

  return result as Record<FeatureKey, boolean>;
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