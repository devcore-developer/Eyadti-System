// src/components/billing/pricing-table.tsx

"use client";

import { useState } from "react";
import { PlanType, BillingCycle } from "@/types/subscription";
import { PlanCard } from "./plan-card";
import { cn } from "@/lib/utils";

interface PricingTableProps {
  plans: PlanType[];
  currentPlanId?: string;
  onSelectPlan: (planId: string, billingCycle: BillingCycle) => void;
  loading?: boolean;
}

export function PricingTable({
  plans,
  currentPlanId,
  onSelectPlan,
  loading,
}: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");

  return (
    <div>
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center mb-10">
        <div className="relative flex items-center bg-gray-100 rounded-full p-1">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={cn(
              "relative z-10 px-6 py-2.5 text-sm font-semibold rounded-full transition-colors",
              billingCycle === "MONTHLY"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("YEARLY")}
            className={cn(
              "relative z-10 px-6 py-2.5 text-sm font-semibold rounded-full transition-colors",
              billingCycle === "YEARLY"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Yearly
            <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Save 20%
            </span>
          </button>
          {/* Sliding indicator background */}
          <div
            className={cn(
              "absolute top-1 h-[calc(100%-8px)] rounded-full bg-white shadow-sm transition-all duration-300",
              billingCycle === "MONTHLY"
                ? "left-1 w-[88px]"
                : "left-[96px] w-[110px]"
            )}
          />
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            currentPlanId={currentPlanId}
            onSelect={(planId) => onSelectPlan(planId, billingCycle)}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}