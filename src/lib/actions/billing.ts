"use server";

import { auth } from "@/lib/auth";
import { requireFinancialAccess } from "@/lib/permissions";
import { getSubscription, getTrialDaysRemaining, getActivePlans } from "@/lib/services/subscription";
import { getUsageStats } from "@/lib/services/usage-limits";
import { type BillingOverview, type FeatureKey } from "@/types/subscription";
import { hasFeature, getFeatureAccess } from "@/lib/services/feature-gate";

/**
 * Get the full billing overview for the current user's clinic
 * PROTECTED: Only ADMIN/SUPER_ADMIN can access billing data
 */
export async function getBillingOverview(): Promise<BillingOverview | null> {
  const session = await auth();
  if (!session?.user?.clinicId) return null;

  // ── Block DOCTOR and RECEPTIONIST from billing data ──
  if (session.user.role === "DOCTOR" || session.user.role === "RECEPTIONIST") {
    return null;
  }

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
 * PUBLIC: Anyone can see plan pricing
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