// src/app/(dashboard)/settings/subscriptions/page.tsx

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSubscription, getActivePlans } from "@/lib/services/subscription";
import { getUsageStats } from "@/lib/services/usage-limits";
import { SubscriptionDetailsClient } from "./subscriptions-client";

export const metadata = {
  title: "Subscription Details | Eyadti",
};

export default async function SubscriptionsPage() {
  const user = await getCurrentUser();
  if (!user?.clinicId) redirect("/login");

  const [subscription, plans, usage] = await Promise.all([
    getSubscription(user.clinicId),
    getActivePlans(),
    getUsageStats(user.clinicId),
  ]);

  if (!subscription) {
    redirect("/settings/billing");
  }

  return (
    <SubscriptionDetailsClient
      subscription={subscription}
      plans={plans}
      usage={usage}
    />
  );
}