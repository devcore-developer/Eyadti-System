"use client"

import { usePathname } from "next/navigation"
import { Lock, CreditCard, AlertCircle, ShieldOff } from "lucide-react"
import Link from "next/link"
import { SUBSCRIPTION_ALLOWED_PATHS } from "@/lib/constants/features"

interface SubscriptionGuardProps {
  children: React.ReactNode
  subscriptionStatus: string | null
  operationalStatus?: string | null // ACTIVE, SUSPENDED, ARCHIVED
  trialEndsAt: Date | null
  endDate: Date | null
}

export function SubscriptionGuard({ 
  children, 
  subscriptionStatus, 
  operationalStatus = "ACTIVE",
  trialEndsAt, 
  endDate 
}: SubscriptionGuardProps) {
  const pathname = usePathname()
  
  // 1. لو السوبر أدمن، سيبه يعدي
  if (subscriptionStatus === "SUPER_ADMIN") {
    return <>{children}</>
  }

  // 2. لو في صفحة مسموح بيها (زي Billing)، سيبه يعدي
  const isAllowedPath = SUBSCRIPTION_ALLOWED_PATHS.some(path => pathname.startsWith(path))
  if (isAllowedPath) {
    return <>{children}</>
  }

  // 3. التحقق من الحالة التشغيلية (التعليق)
  if (operationalStatus === "SUSPENDED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-6 animate-fade-in-up">
        <div className="relative">
          <div className="absolute -inset-4 bg-red-100 dark:bg-red-900/20 rounded-full blur-xl opacity-50"></div>
          <div className="relative bg-white dark:bg-[#1E293B] p-6 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800/30">
            <ShieldOff className="h-16 w-16 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Clinic Suspended</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            This clinic has been suspended by the platform administration. All access is temporarily restricted.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <a 
            href="https://wa.me/201275976195?text=My clinic has been suspended and I need assistance."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white px-6 py-3 rounded-xl font-semibold shadow-[0_8px_20px_rgba(107,156,255,0.3)] hover:-translate-y-0.5 transition-all"
          >
            <AlertCircle className="h-5 w-5" />
            Contact Support
          </a>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/login' }}
            className="inline-flex items-center gap-2 border-2 border-slate-200 dark:border-slate-700 text-foreground px-6 py-3 rounded-xl font-semibold hover:border-red-400 transition-colors"
          >
            <Lock className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    )
  }

  // 4. التحقق من انتهاء الفترة التجريبية (Trial) فقط
  if (subscriptionStatus === "TRIAL") {
    if (trialEndsAt && new Date(trialEndsAt) < new Date()) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-6 animate-fade-in-up">
          <div className="relative">
            <div className="absolute -inset-4 bg-amber-100 dark:bg-amber-900/20 rounded-full blur-xl opacity-50"></div>
            <div className="relative bg-white dark:bg-[#1E293B] p-6 rounded-2xl shadow-2xl border border-amber-200 dark:border-amber-800/30">
              <CreditCard className="h-16 w-16 text-amber-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Free Trial Expired</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your free trial has ended. Please activate a subscription code to continue.
            </p>
          </div>
          <Link 
            href="/settings/billing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white px-6 py-3 rounded-xl font-semibold shadow-[0_8px_20px_rgba(107,156,255,0.3)] hover:-translate-y-0.5 transition-all"
          >
            <CreditCard className="h-5 w-5" />
            Go to Billing
          </Link>
        </div>
      )
    }
  }

  // ✅ ملاحظة هامة: حالة EXPIRED للإشتراك المدفوع لا تمنع الوصول (حسب طلبك)
  // العيادة تستمر في العمل بشكل طبيعي حتى يقوم السوبر أدمن بتعليقها يدوياً.

  return <>{children}</>
}