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
  features?: Record<string, boolean>;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  compact,
  features,
}: FeatureGateProps) {
  const { hasFeatureAccess } = useSubscription();

  // ═══ FIX: Use server-provided features if available, fall back to hook ═══
  const allowed = features
    ? (features[feature] ?? false)
    : hasFeatureAccess(feature);

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <FeatureGateBanner feature={feature} compact={compact} />;
}