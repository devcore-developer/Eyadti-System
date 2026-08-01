"use client";

import { useSession } from "next-auth/react";
import { SubscriptionStatus } from "@prisma/client";

export function useSubscription() {
  const { data: session } = useSession();

  const status = (session?.user?.subscriptionStatus ?? null) as SubscriptionStatus | null;
  const trialEndsAt = session?.user?.trialEndsAt ?? null;
  const currentPeriodEnd = session?.user?.currentPeriodEnd ?? null;

  const isActive = status === "TRIAL" || status === "ACTIVE";
  const isExpired = status === "EXPIRED" || status === "SUSPENDED";
  const isTrial = status === "TRIAL";

  const trialDaysRemaining = (() => {
    if (!trialEndsAt) return null;
    const diff = new Date(trialEndsAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  })();

  // NOTE: Client-side feature checks are unreliable because feature flags
  // live on the Plan model in the database, not in the JWT.
  // Use server-side hasFeature() from lib/services/feature-gate.ts instead.
  // This stub returns false to prevent accidental feature access.
  const hasFeatureAccess = (_feature: string): boolean => {
    if (!isActive) return false;
    return false;
  };

  return {
    status,
    trialEndsAt,
    currentPeriodEnd,
    trialDaysRemaining,
    isActive,
    isExpired,
    isTrial,
    hasFeatureAccess,
  };
}