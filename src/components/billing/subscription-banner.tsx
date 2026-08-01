"use client";

import { useSubscription } from "@/hooks/use-subscription";
import { AlertTriangle, ArrowUpRight, Clock } from "lucide-react";
import Link from "next/link";

export function SubscriptionBanner() {
  const { isTrial, trialDaysRemaining, isExpired } = useSubscription();

  if (!isTrial && !isExpired) return null;

  if (isTrial && trialDaysRemaining !== null && trialDaysRemaining <= 7) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-[#F4B860]/[0.06] border border-[#F4B860]/20 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-[#F4B860]/[0.1]">
            <Clock className="w-4 h-4 text-[#F4B860]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#F4B860]">
              Trial expires in {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Upgrade to keep your clinic data.
            </p>
          </div>
        </div>
        <Link href="/settings/billing">
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F4B860] hover:bg-[#e5a84d] text-white text-[12px] font-semibold rounded-lg transition-colors shadow-sm">
            Upgrade
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-[#EF6B6B]/[0.06] border border-[#EF6B6B]/20 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-[#EF6B6B]/[0.1]">
            <AlertTriangle className="w-4 h-4 text-[#EF6B6B]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#EF6B6B]">
              Subscription expired
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Renew to continue using all features.
            </p>
          </div>
        </div>
        <Link href="/settings/billing">
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EF6B6B] hover:bg-[#e05e5e] text-white text-[12px] font-semibold rounded-lg transition-colors shadow-sm">
            Renew
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>
    );
  }

  return null;
}