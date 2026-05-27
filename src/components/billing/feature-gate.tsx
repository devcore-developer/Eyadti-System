// src/components/billing/feature-gate.tsx

"use client";

import { ReactNode } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { FeatureKey } from "@/types/subscription";
import { FeatureGateBanner } from "./feature-gate-banner";

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  compact?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  compact,
}: FeatureGateProps) {
  const { hasFeatureAccess } = useSubscription();

  if (hasFeatureAccess(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <FeatureGateBanner feature={feature} compact={compact} />;
}