"use client"

import { FeatureKey } from "@/types/subscription"
import { FEATURES } from "@/lib/constants/features"
import { Lock, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface FeatureGateBannerProps {
  feature: FeatureKey
  compact?: boolean
}

export function FeatureGateBanner({
  feature,
  compact = false,
}: FeatureGateBannerProps) {
  const router = useRouter()
  const config = FEATURES[feature]

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-[#6B9CFF]/5 border border-[#6B9CFF]/20 rounded-xl">
        <Lock className="h-4 w-4 text-[#6B9CFF] shrink-0" />
        <span className="text-sm text-muted-foreground">
          {config?.label || feature} is available in the {config?.badge || "Professional"} plan
        </span>
        <button
          onClick={() => router.push("/settings/billing")}
          className="text-sm font-semibold text-[#6B9CFF] hover:text-[#6B9CFF]/80 ml-auto whitespace-nowrap"
        >
          Upgrade
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center w-16 h-16 bg-[#6B9CFF]/10 rounded-2xl mb-4">
        <Lock className="h-8 w-8 text-[#6B9CFF]" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">
        {config?.label || "Feature"} is a Premium Feature
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-2">
        {config?.description || "Upgrade your plan to unlock this feature."}
      </p>
      <p className="text-sm font-medium text-[#6B9CFF] mb-6">
        Included in the {config?.badge || "Professional"} Plan
      </p>
      <Button
        onClick={() => router.push("/settings/billing")}
        className="bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] hover:opacity-90 text-white"
      >
        <ArrowUpRight className="w-4 h-4 mr-2" />
        Upgrade Plan
      </Button>
    </div>
  )
}