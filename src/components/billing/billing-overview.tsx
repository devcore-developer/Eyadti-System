// src/components/billing/billing-overview.tsx

"use client";

import { BillingOverview as BillingOverviewType, PlanType, BillingCycle } from "@/types/subscription";
import { SubscriptionBadge } from "./subscription-badge";
import { UsageProgress } from "./usage-progress";
import { PricingTable } from "./pricing-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreditCard,
  Calendar,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/constants/features";
import { format } from "date-fns";
import Link from "next/link";

interface BillingOverviewProps {
  data: BillingOverviewType;
  plans: PlanType[];
  onSelectPlan: (planId: string, billingCycle: BillingCycle) => void;
  onCancel: () => void;
  onReactivate: (
    subscriptionId: string,
    planId: string,
    billingCycle: BillingCycle
  ) => void;
  loading?: boolean;
}

export function BillingOverview({
  data,
  plans,
  onSelectPlan,
  onCancel,
  onReactivate,
  loading,
}: BillingOverviewProps) {
  const { subscription, usage, trialDaysRemaining, isTrialActive, canUpgrade } = data;

  const isExpired =
    subscription.status === "EXPIRED" || subscription.status === "SUSPENDED";
  const isCancelled = subscription.status === "CANCELLED";

  // Helper to safely format dates
  const formatDateSafe = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="space-y-8">
      {/* ─── Expiry / Trial Warning Banner ─────────────────────── */}
      {isExpired && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Your subscription has {subscription.status.toLowerCase()}
            </p>
            <p className="text-sm text-red-600">
              Please upgrade or reactivate your plan to continue using all features.
            </p>
          </div>
        </div>
      )}

      {isTrialActive && trialDaysRemaining !== null && trialDaysRemaining <= 5 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Your trial expires in {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-amber-600">
              Upgrade now to avoid losing access to your clinic data.
            </p>
          </div>
        </div>
      )}

      {/* ─── Current Plan Summary ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Current Plan</CardTitle>
                <p className="text-sm text-gray-500">
                  Manage your subscription and billing
                </p>
              </div>
            </div>
            <SubscriptionBadge
              status={subscription.status}
              trialDaysRemaining={trialDaysRemaining}
              size="lg"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {subscription.plan.name}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {subscription.status === "TRIAL"
                  ? "Trial Ends"
                  : subscription.endDate
                  ? "Renews On"
                  : "Start Date"}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {subscription.status === "TRIAL" && subscription.trialEndsAt
                  ? formatDateSafe(subscription.trialEndsAt)
                  : subscription.endDate
                  ? formatDateSafe(subscription.endDate)
                  : formatDateSafe(subscription.startDate)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1 flex items-center gap-2">
                {subscription.status === "ACTIVE" && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
                {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6">
            {canUpgrade && (
              <Link href="#pricing-section">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </Link>
            )}
            {isCancelled && (
              <Button
                onClick={() =>
                  onReactivate(subscription.id, subscription.planId, "MONTHLY")
                }
                variant="outline"
                disabled={loading}
              >
                Reactivate Subscription
              </Button>
            )}
            {!isCancelled && subscription.status === "ACTIVE" && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                disabled={loading}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Usage Statistics ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <CardTitle className="text-lg">Usage Statistics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {usage.map((stat) => (
              <UsageProgress key={stat.resource} stat={stat} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Pricing Section ───────────────────────────────────── */}
      {plans.length > 0 && (
        <div id="pricing-section" className="scroll-mt-24">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {canUpgrade ? "Upgrade Your Plan" : "Choose Your Plan"}
              </CardTitle>
              <p className="text-gray-500 mt-1">
                Select the plan that best fits your clinic&apos;s needs
              </p>
            </CardHeader>
            <CardContent>
              <PricingTable
                plans={plans}
                currentPlanId={subscription.planId}
                onSelectPlan={onSelectPlan}
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}