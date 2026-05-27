"use server";

import { auth } from "@/lib/auth"; // ← استخدمنا الـ auth بتاعتك
import { getSubscription, getTrialDaysRemaining, getActivePlans } from "@/lib/services/subscription";
import { getUsageStats } from "@/lib/services/usage-limits";
import { getFeatureAccess } from "@/lib/services/feature-gate";
import { BillingOverview, FeatureKey } from "@/types/subscription";

/**
 * Get the full billing overview for the current user's clinic
 */
export async function getBillingOverview(): Promise<BillingOverview | null> {
  const session = await auth(); // ← بدل getCurrentUser
  if (!session?.user?.clinicId) return null;

  const subscription = await getSubscription(session.user.clinicId);
  if (!subscription) return null;

  const usage = await getUsageStats(session.user.clinicId);
  const trialDaysRemaining = getTrialDaysRemaining(subscription.trialEndsAt);
  const isTrialActive =
    subscription.status === "TRIAL" && (trialDaysRemaining ?? 0) > 0;

  const allPlans = await getActivePlans();
  const currentPlanIndex = allPlans.findIndex(
    (p) => p.id === subscription.planId
  );
  const canUpgrade = currentPlanIndex < allPlans.length - 1;

  return {
    subscription,
    usage,
    trialDaysRemaining,
    isTrialActive,
    canUpgrade,
  };
}

/**
 * Get all active plans for pricing display
 */
export async function getPricingPlans() {
  return getActivePlans();
}

/**
 * Check feature access for current clinic
 */
export async function checkFeatureAccess(feature: FeatureKey): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.clinicId) return false;

  const { hasFeature } = await import("@/lib/services/feature-gate");
  return hasFeature(session.user.clinicId, feature);
}

/**
 * Get all feature access for current clinic
 */
export async function getAllFeatureAccess(): Promise<Record<FeatureKey, boolean>> {
  const session = await auth();
  if (!session?.user?.clinicId) {
    const { FEATURES } = await import("@/lib/constants/features");
    const result: Record<string, boolean> = {};
    for (const key of Object.keys(FEATURES)) {
      result[key] = false;
    }
    return result as Record<FeatureKey, boolean>;
  }

  return getFeatureAccess(session.user.clinicId);
}