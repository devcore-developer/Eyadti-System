// src/components/invoices/plan-card.tsx

"use client";

import { PlanType, BillingCycle } from "@/types/subscription";
import {
  Check,
  X,
  Sparkles,
  Users,
  Stethoscope,
  UserCheck,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: PlanType;
  billingCycle: BillingCycle;
  currentPlanId?: string;
  onSelect: (planId: string) => void;
  loading?: boolean;
}

export function PlanCard({
  plan,
  billingCycle,
  currentPlanId,
  onSelect,
  loading,
}: PlanCardProps) {
  const isCurrentPlan = currentPlanId === plan.id;
  const isPopular = plan.slug === "professional";

  const price =
    billingCycle === "MONTHLY" ? plan.monthlyPrice : plan.yearlyPrice;
  const period = billingCycle === "MONTHLY" ? "/mo" : "/yr";
  const yearlySavings =
    plan.monthlyPrice > 0
      ? Math.round(
          ((plan.monthlyPrice * 12 - plan.yearlyPrice) /
            (plan.monthlyPrice * 12)) *
            100
        )
      : 0;

  const features = [
    {
      icon: Stethoscope,
      label: plan.maxDoctors
        ? `Up to ${plan.maxDoctors} doctor${plan.maxDoctors > 1 ? "s" : ""}`
        : "Unlimited doctors",
      enabled: true,
    },
    {
      icon: Users,
      label: plan.maxUsers
        ? `Up to ${plan.maxUsers} user${plan.maxUsers > 1 ? "s" : ""}`
        : "Unlimited users",
      enabled: true,
    },
    {
      icon: UserCheck,
      label: plan.maxPatients
        ? `Up to ${plan.maxPatients} patients`
        : "Unlimited patients",
      enabled: true,
    },
    {
      icon: Building2,
      label: plan.maxBranches
        ? `Up to ${plan.maxBranches} branch${plan.maxBranches > 1 ? "es" : ""}`
        : "Unlimited branches",
      enabled: true,
    },
    {
      label: "Online Booking Portal",
      enabled: plan.onlineBookingEnabled,
    },
    {
      label: "Advanced Analytics",
      enabled: plan.analyticsEnabled,
    },
    {
      label: "Notifications & Reminders",
      enabled: plan.notificationsEnabled,
    },
  ];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-sm transition-all duration-200",
        isPopular
          ? "border-indigo-500 shadow-lg shadow-indigo-100 scale-[1.02]"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md",
        isCurrentPlan && "border-emerald-500 bg-emerald-50/30"
      )}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-indigo-600 hover:bg-indigo-700 px-4 py-1 text-sm font-semibold shadow-md">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge
            variant="outline"
            className="bg-emerald-600 text-white border-emerald-600 px-4 py-1 text-sm font-semibold shadow-md"
          >
            Current Plan
          </Badge>
        </div>
      )}

      {/* Plan Name */}
      <div className="text-center mb-6 pt-2">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        {plan.description && (
          <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
        )}
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-extrabold text-gray-900">
            ${Number(price).toFixed(0)}
          </span>
          <span className="text-gray-500 font-medium">{period}</span>
        </div>
        {billingCycle === "YEARLY" && yearlySavings > 0 && (
          <p className="mt-1 text-sm font-medium text-emerald-600">
            Save {yearlySavings}% annually
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            {feature.enabled ? (
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
            )}
            <span
              className={cn(
                "text-sm",
                feature.enabled ? "text-gray-700" : "text-gray-400"
              )}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Button
        onClick={() => !isCurrentPlan && onSelect(plan.id)}
        disabled={isCurrentPlan || loading}
        className={cn(
          "w-full h-12 text-base font-semibold rounded-xl transition-all",
          isCurrentPlan
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-default"
            : isPopular
            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
            : "bg-gray-900 hover:bg-gray-800 text-white"
        )}
      >
        {isCurrentPlan
          ? "Current Plan"
          : loading
          ? "Processing..."
          : "Upgrade Now"}
      </Button>
    </div>
  );
}