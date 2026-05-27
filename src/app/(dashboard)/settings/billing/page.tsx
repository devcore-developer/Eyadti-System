// src/app/(dashboard)/settings/billing/page.tsx

import {
  getBillingOverview,
  getPricingPlans,
} from "@/lib/actions/billing";
import { BillingPageClient } from "./billing-page-client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth"; // ← استخدمنا الـ auth اللي عندك

export const metadata = {
  title: "Billing & Subscription | Eyadti",
};

export default async function BillingPage() {
  const session = await auth(); // ← بدل getCurrentUser
  
  if (!session?.user?.clinicId) {
    redirect("/login");
  }

  const [overview, plans] = await Promise.all([
    getBillingOverview(),
    getPricingPlans(),
  ]);

  if (!overview) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No Subscription Found
          </h2>
          <p className="text-gray-500">
            Please contact support to set up your subscription.
          </p>
        </div>
      </div>
    );
  }

  return <BillingPageClient overview={overview} plans={plans} />;
}