"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BillingOverview as BillingOverviewType, PlanType, BillingCycle } from "@/types/subscription";
import { BillingOverview } from "@/components/billing/billing-overview";
import {
  subscribeToPlan,
  cancelMySubscription,
  reactivateMySubscription,
} from "@/lib/actions/subscriptions";

interface BillingPageClientProps {
  overview: BillingOverviewType;
  plans: PlanType[];
}

export function BillingPageClient({ overview, plans }: BillingPageClientProps) {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);

  // ✅ حماية ضد الـ null عشان TypeScript
  if (!overview || !overview.subscription) {
    return (
      <div className="p-6 text-center text-gray-500">
        No subscription data found. Please contact support.
      </div>
    );
  }

  async function handleSelectPlan(planId: string, billingCycle: BillingCycle) {
    setLoading(true);
    const result = await subscribeToPlan({
      clinicId: overview.subscription!.clinicId,
      planId,
      billingCycle,
    });

    if (result.success) {
      await update(); 
      router.refresh(); 
    } else {
      alert(result.error || "Failed to change plan");
    }
    setLoading(false);
  }

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel your subscription? You will lose access to premium features.")) {
      return;
    }

    setLoading(true);
    const result = await cancelMySubscription({
      subscriptionId: overview.subscription!.id,
    });

    if (result.success) {
      await update(); 
      router.refresh();
    } else {
      alert(result.error || "Failed to cancel subscription");
    }
    setLoading(false);
  }

  async function handleReactivate(
    subscriptionId: string,
    planId: string,
    billingCycle: BillingCycle
  ) {
    setLoading(true);
    const result = await reactivateMySubscription(
      subscriptionId,
      planId,
      billingCycle
    );

    if (result.success) {
      await update(); 
      router.refresh();
    } else {
      alert(result.error || "Failed to reactivate subscription");
    }
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Billing & Subscription
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your plan, view usage, and upgrade
        </p>
      </div>

      {/* Expired URL param banner */}
      {typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("expired") ===
          "1" && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm font-semibold text-red-800">
              Your subscription has expired. Please upgrade to continue using
              Nexora.
            </p>
          </div>
        )}

      <BillingOverview
        data={overview}
        plans={plans}
        onSelectPlan={handleSelectPlan}
        onCancel={handleCancel}
        onReactivate={handleReactivate}
        loading={loading}
      />
    </div>
  );
}