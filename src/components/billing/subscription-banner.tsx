// src/components/billing/subscription-banner.tsx

"use client";

import { useSubscription } from "@/hooks/use-subscription";
import { AlertTriangle, ArrowUpRight, Clock } from "lucide-react";
import Link from "next/link";

export function SubscriptionBanner() {
  const { isTrial, trialDaysRemaining, isExpired } = useSubscription();

  // لو الاشتراك شغال وعادي مفيش بانر
  if (!isTrial && !isExpired) return null;

  // لو التريال هينتهي خلال 7 أيام
  if (isTrial && trialDaysRemaining !== null && trialDaysRemaining <= 7) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Your free trial expires in {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-amber-600">
              Upgrade now to avoid losing access to your clinic data.
            </p>
          </div>
        </div>
        <Link href="/settings/billing">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
            Upgrade Plan
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    );
  }

  // لو الاشتراك منتهي
  if (isExpired) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Your subscription has expired
            </p>
            <p className="text-xs text-red-600">
              Please renew your plan to continue using all features.
            </p>
          </div>
        </div>
        <Link href="/settings/billing">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
            Renew Plan
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    );
  }

  return null;
}