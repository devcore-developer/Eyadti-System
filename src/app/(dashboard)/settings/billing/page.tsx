import {
  getBillingOverview,
  getPricingPlans,
} from "@/lib/actions/billing";
import { BillingPageClient } from "./billing-page-client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RedeemForm } from "@/components/subscription/redeem-form"; // ← استدعاء الفورم

export const metadata = {
  title: "Billing & Subscription | Eyadti",
};

export default async function BillingPage() {
  const session = await auth();
  
  if (!session?.user?.clinicId) {
    redirect("/login");
  }

  const [overview, plans] = await Promise.all([
    getBillingOverview(),
    getPricingPlans(),
  ]);

  if (!overview) {
    return (
      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No Subscription Found
          </h2>
          <p className="text-gray-500 mb-6">
            Please enter an activation code or contact support to set up your subscription.
          </p>
          {/* ✅ عرض فورم الكود لو مفيش اشتراك خالص */}
          <div className="max-w-md mx-auto">
            <RedeemForm />
          </div>
        </div>
      </div>
    );
  }

  // ✅ لو الاشتراك منتهي، اعرضله فورم الكود في الأعلى
  const isExpired = session.user.subscriptionStatus === "EXPIRED" || 
                    session.user.subscriptionStatus === "SUSPENDED" ||
                    (overview.currentPeriodEnd && new Date(overview.currentPeriodEnd) < new Date());

  return (
    <div className="space-y-6">
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Subscription Expired</h2>
          <p className="text-red-600 mb-4">Your subscription has expired. Please activate a code to continue.</p>
          <RedeemForm />
        </div>
      )}
      
      {/* عرض صفحة الباقات والفواتير العادية */}
      <BillingPageClient overview={overview} plans={plans} />
    </div>
  );
}