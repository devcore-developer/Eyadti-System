// src/app/(dashboard)/settings/billing/page.tsx
import {
  getBillingOverview,
  getPricingPlans,
} from "@/lib/actions/billing";
import { BillingPageClient } from "./billing-page-client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RedeemForm } from "@/components/subscription/redeem-form";
import { differenceInDays } from "date-fns";

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
          <div className="max-w-md mx-auto">
            <RedeemForm />
          </div>
        </div>
      </div>
    );
  }

  // ✅ حساب الأيام المتبقية في التجربة المجانية
  const isTrial = session.user.subscriptionStatus === "TRIAL";
  let daysRemaining = 0;
  
  if (isTrial && session.user.trialEndsAt) {
    const remaining = differenceInDays(new Date(session.user.trialEndsAt), new Date());
    daysRemaining = remaining > 0 ? remaining : 0;
  }

  // ✅ حساب الأيام المتبقية في الاشتراك المدفوع
  const isActive = session.user.subscriptionStatus === "ACTIVE";
  let activeDaysRemaining = 0;
  
  if (isActive && session.user.currentPeriodEnd) {
    const remaining = differenceInDays(new Date(session.user.currentPeriodEnd), new Date());
    activeDaysRemaining = remaining > 0 ? remaining : 0;
  }

  // ✅ تحديد هل الاشتراك منتهي ولا لأ
  const isExpired = session.user.subscriptionStatus === "EXPIRED" || 
                    session.user.subscriptionStatus === "SUSPENDED" ||
                    (isTrial && daysRemaining === 0) ||
                    (isActive && activeDaysRemaining === 0);

  return (
    <div className="space-y-6">
      
      {/* ✅ رسالة التجربة المجانية (زرقاء) */}
      {isTrial && daysRemaining > 0 && !isExpired && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-blue-700 mb-2">Free Trial Active</h2>
          <p className="text-blue-600 mb-4">
            You have <span className="font-bold text-2xl">{daysRemaining}</span> days remaining in your free trial.
          </p>
          <p className="text-sm text-blue-500 mb-4">
            Activate a subscription code now to continue using all features after the trial ends.
          </p>
          <RedeemForm />
        </div>
      )}

      {/* ✅ رسالة الاشتراك المدفوع (خضراء) */}
      {isActive && activeDaysRemaining > 0 && !isExpired && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-700 font-medium">
            Your subscription is active. <span className="font-bold">{activeDaysRemaining}</span> days remaining.
          </p>
        </div>
      )}

      {/* ✅ رسالة انتهاء الاشتراك (حمراء) */}
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