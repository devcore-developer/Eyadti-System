// src/components/invoices/feature-gate-banner.tsx

"use client";

import { FeatureKey } from "@/types/subscription";
import { FEATURES } from "@/lib/constants/features";
import { Lock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface FeatureGateBannerProps {
  feature: FeatureKey;
  compact?: boolean;
}

export function FeatureGateBanner({
  feature,
  compact = false,
}: FeatureGateBannerProps) {
  const router = useRouter();
  const config = FEATURES[feature];

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <Lock className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">
          {config.label} is not available on your plan
        </span>
        <button
          onClick={() => router.push("/settings/billing")}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 ml-auto"
        >
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
        <Lock className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {config.label} is a Premium Feature
      </h3>
      <p className="text-gray-500 text-center max-w-md mb-6">
        {config.description}. Upgrade your plan to unlock this feature and more.
      </p>
      <Button
        onClick={() => router.push("/settings/billing")}
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        <ArrowUpRight className="w-4 h-4 mr-1" />
        Upgrade Plan
      </Button>
    </div>
  );
}