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
            Please enter an activation code or contact support.
          </p>
          <div className="max-w-md mx-auto">
            <RedeemForm />
          </div>
        </div>
      </div>
    );
  }

  // ✅ حساب الأيام المتبقية
  const isTrial = session.user.subscriptionStatus === "TRIAL";
  const isActive = session.user.subscriptionStatus === "ACTIVE";
  let daysRemaining = 0;
  
  if (isTrial && session.user.trialEndsAt) {
    const remaining = differenceInDays(new Date(session.user.trialEndsAt), new Date());
    daysRemaining = remaining > 0 ? remaining : 0;
  } else if (isActive && session.user.currentPeriodEnd) {
    const remaining = differenceInDays(new Date(session.user.currentPeriodEnd), new Date());
    daysRemaining = remaining > 0 ? remaining : 0;
  }

  // ✅ هل الاشتراك منتهي؟
  const isExpired = session.user.subscriptionStatus === "EXPIRED" || 
                    session.user.subscriptionStatus === "SUSPENDED" ||
                    ((isTrial || isActive) && daysRemaining === 0);

  return (
    <div className="space-y-6">
      
      {/* ✅ عداد التجربة المجانية (3 أيام) */}
      {isTrial && daysRemaining > 0 && !isExpired && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-blue-700 mb-2">🚀 Free Trial Active</h2>
          <p className="text-blue-600 mb-4 text-lg">
            You have <span className="font-black text-3xl text-blue-800">{daysRemaining}</span> days remaining in your free trial.
          </p>
          <p className="text-sm text-blue-500 mb-4">
            Activate a subscription code now to continue using all features after the trial ends.
          </p>
          <RedeemForm />
        </div>
      )}

      {/* ✅ عداد الاشتراك المدفوع */}
      {isActive && daysRemaining > 0 && !isExpired && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-green-700 mb-2">✅ Subscription Active</h2>
          <p className="text-green-600 mb-4 text-lg">
            You have <span className="font-black text-3xl text-green-800">{daysRemaining}</span> days remaining.
          </p>
        </div>
      )}

      {/* ✅ رسالة انتهاء الاشتراك (مطلوب كود) */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">⛔ Subscription Expired</h2>
          <p className="text-red-600 mb-4">Your trial or subscription has ended. Please activate a code to continue using the system.</p>
          <RedeemForm />
        </div>
      )}

      {/* عرض صفحة الباقات والفواتير العادية */}
      <BillingPageClient overview={overview} plans={plans} />
    </div>
  );
}