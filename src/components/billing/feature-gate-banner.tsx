// src/components/billing/feature-gate-banner.tsx

"use client";

import { FeatureKey } from "@/types/subscription";
import { FEATURES } from "@/lib/constants/features";
import { Lock, ArrowUpRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface FeatureGateBannerProps {
  feature: FeatureKey;
  compact?: boolean;
}

// Features that require Enterprise (Contact Sales)
const ENTERPRISE_FEATURES: FeatureKey[] = [
  // Add any enterprise-only features here if needed in the future
];

export function FeatureGateBanner({
  feature,
  compact = false,
}: FeatureGateBannerProps) {
  const router = useRouter();
  const config = FEATURES[feature];
  const isEnterpriseOnly = ENTERPRISE_FEATURES.includes(feature);

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
        <Lock className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {config?.label || feature} is not available on your plan
        </span>
        {isEnterpriseOnly ? (
          <a
            href="https://wa.me/201275976195?text=I'm interested in Enterprise features"
            target="_blank"
            className="text-sm font-medium text-amber-600 hover:text-amber-700 ml-auto whitespace-nowrap"
          >
            Contact Sales
          </a>
        ) : (
          <button
            onClick={() => router.push("/settings/billing")}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 ml-auto whitespace-nowrap"
          >
            Upgrade
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4">
        <Lock className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {config?.label || "Feature"} is a Premium Feature
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        {config?.description || "Upgrade your plan to unlock this feature and more."}
      </p>
      {isEnterpriseOnly ? (
        <a
          href="https://wa.me/201275976195?text=I'm interested in Enterprise features"
          target="_blank"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Contact Sales
        </a>
      ) : (
        <Button
          onClick={() => router.push("/settings/billing")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <ArrowUpRight className="w-4 h-4 mr-2" />
          Upgrade Plan
        </Button>
      )}
    </div>
  );
}