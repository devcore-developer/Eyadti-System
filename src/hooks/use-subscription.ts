// src/hooks/use-subscription.ts

"use client";

import { useSession } from "next-auth/react";
import { SubscriptionStatus } from "@prisma/client";
import { FeatureKey } from "@/types/subscription";
import { FEATURES } from "@/lib/constants/features";

export function useSubscription() {
  const { data: session } = useSession();

  const status = (session?.user?.subscriptionStatus ??
    null) as SubscriptionStatus | null;
  const planSlug = session?.user?.planSlug ?? null;
  const trialEndsAt = session?.user?.trialEndsAt ?? null;

  const isActive =
    status === "TRIAL" || status === "ACTIVE";

  const isExpired =
    status === "EXPIRED" || status === "SUSPENDED";

  const isTrial = status === "TRIAL";

  const trialDaysRemaining = (() => {
    if (!trialEndsAt) return null;
    const diff = new Date(trialEndsAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  })();

  // Client-side feature check based on plan slug (approximate)
  // For authoritative checks, use server-side hasFeature()
  const hasFeatureAccess = (feature: FeatureKey): boolean => {
    if (!isActive) return false;
    const slug = planSlug;

    if (feature === "ONLINE_BOOKING") {
      return slug === "professional" || slug === "enterprise";
    }
    if (feature === "ADVANCED_ANALYTICS") {
      return slug === "professional" || slug === "enterprise";
    }
    if (feature === "NOTIFICATIONS") {
      return slug === "professional" || slug === "enterprise";
    }
    if (feature === "WHATSAPP_INTEGRATION") {
      return slug === "professional" || slug === "enterprise";
    }
    if (feature === "MULTI_BRANCH") {
      return slug === "enterprise";
    }

    return false;
  };

  return {
    status,
    planSlug,
    trialEndsAt,
    trialDaysRemaining,
    isActive,
    isExpired,
    isTrial,
    hasFeatureAccess,
  };
}