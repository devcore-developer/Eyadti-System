// src/app/(dashboard)/settings/subscriptions/subscriptions-client.tsx

"use client";

import { SubscriptionType, PlanType, UsageStat } from "@/types/subscription";
import { SubscriptionBadge } from "@/components/billing/subscription-badge";
import { UsageProgress } from "@/components/billing/usage-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  CreditCard,
  Calendar,
  Info,
} from "lucide-react";

interface SubscriptionDetailsClientProps {
  subscription: SubscriptionType;
  plans: PlanType[];
  usage: UsageStat[];
}

export function SubscriptionDetailsClient({
  subscription,
  plans,
  usage,
}: SubscriptionDetailsClientProps) {
  const plan = subscription.plan;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Subscription Details
        </h1>
        <p className="text-gray-500 mt-1">
          View your current subscription information
        </p>
      </div>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <CardTitle>{plan.name} Plan</CardTitle>
            <SubscriptionBadge status={subscription.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="font-semibold">
                {format(new Date(subscription.startDate), "MMMM d, yyyy")}
              </p>
            </div>
            {subscription.endDate && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">End Date</p>
                <p className="font-semibold">
                  {format(new Date(subscription.endDate), "MMMM d, yyyy")}
                </p>
              </div>
            )}
            {subscription.trialEndsAt && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-600">Trial Ends</p>
                <p className="font-semibold text-amber-800">
                  {format(new Date(subscription.trialEndsAt), "MMMM d, yyyy")}
                </p>
              </div>
            )}
            {subscription.cancelledAt && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600">Cancelled On</p>
                <p className="font-semibold text-red-800">
                  {format(new Date(subscription.cancelledAt), "MMMM d, yyyy")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-indigo-600" />
            <CardTitle>Plan Features</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureItem
              label="Online Booking"
              enabled={plan.onlineBookingEnabled}
            />
            <FeatureItem
              label="Advanced Analytics"
              enabled={plan.analyticsEnabled}
            />
            <FeatureItem
              label="Notifications"
              enabled={plan.notificationsEnabled}
            />
            <FeatureItem
              label="Multi-Branch"
              enabled={plan.maxBranches === null || plan.maxBranches > 1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <CardTitle>Usage</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {usage.map((stat) => (
              <UsageProgress key={stat.resource} stat={stat} compact />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureItem({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg ${
        enabled ? "bg-emerald-50" : "bg-gray-50"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          enabled ? "bg-emerald-500" : "bg-gray-300"
        }`}
      />
      <span
        className={`text-sm ${
          enabled ? "text-emerald-700 font-medium" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}