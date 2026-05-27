// src/app/(dashboard)/settings/subscriptions/page.tsx

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSubscription, getActivePlans } from "@/lib/services/subscription";
import { getUsageStats } from "@/lib/services/usage-limits";
import { SubscriptionDetailsClient } from "./subscriptions-client";

export const metadata = {
  title: "Subscription Details | Eyadti",
};

export default async function SubscriptionsPage() {
  // استخدام دالة auth() بدلاً من getCurrentUser
  const session = await auth();
  
  // التحقق من تسجيل الدخول ووجود clinicId
  if (!session?.user?.clinicId) redirect("/login");

  const clinicId = session.user.clinicId;

  const [subscription, plans, usage] = await Promise.all([
    getSubscription(clinicId),
    getActivePlans(),
    getUsageStats(clinicId),
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