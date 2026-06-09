"use client"

import { usePathname } from "next/navigation"
import { Lock, CreditCard, AlertCircle } from "lucide-react"
import Link from "next/link"
import { SUBSCRIPTION_ALLOWED_PATHS } from "@/lib/constants/features"

interface SubscriptionGuardProps {
  children: React.ReactNode
  status: string | null
  trialEndsAt: Date | null
  endDate: Date | null
}

export function SubscriptionGuard({ children, status, trialEndsAt, endDate }: SubscriptionGuardProps) {
  const pathname = usePathname()
  
  // 1. لو السوبر أدمن، سيبه يعدي
  if (status === "SUPER_ADMIN") {
    return <>{children}</>
  }

  // 2. لو في صفحة مسموح بيها (زي Billing أو الـ Settings)، سيبه يعدي عشان يقدر يدفع
  const isAllowedPath = SUBSCRIPTION_ALLOWED_PATHS.some(path => pathname.startsWith(path))
  if (isAllowedPath) {
    return <>{children}</>
  }

  // 3. التحقق من حالة الاشتراك
  const now = new Date()
  let isLocked = false
  let title = "Access Restricted"
  let message = "You do not have access to this section."

  // لو الحالة مفقودة أو ملغاة أو موقوفة
  if (status === "SUSPENDED" || status === "EXPIRED") {
    isLocked = true
    title = status === "SUSPENDED" ? "Account Suspended" : "Subscription Expired"
    message = status === "SUSPENDED" 
      ? "Your account has been suspended by the administration. Please contact support."
      : "Your subscription has expired. Renew your plan to regain access to all features."
  } 
  
  // لو في تجربة مجانية (14 يوم) وانتهت
  else if (status === "TRIAL") {
    if (trialEndsAt && new Date(trialEndsAt) < now) {
      isLocked = true
      title = "Free Trial Expired"
      message = "Your 10-day free trial has ended. Please activate a subscription code to continue using the system."
    }
  } 
  
  // لو الاشتراك الفعال وانتهت مدته
  else if (status === "ACTIVE" || status === "CANCELLED") {
    if (endDate && new Date(endDate) < now) {
      isLocked = true
      title = "Subscription Expired"
      message = "Your subscription period has ended. Please renew your plan to continue."
    }
  }

  // 4. لو المقفول، اعرض شاشة المنع (Lockdown Screen)
  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-6 animate-fade-in-up">
        <div className="relative">
          <div className="absolute -inset-4 bg-red-100 dark:bg-red-900/20 rounded-full blur-xl opacity-50"></div>
          <div className="relative bg-white dark:bg-[#1E293B] p-6 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800/30">
            <Lock className="h-16 w-16 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/settings/billing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white px-6 py-3 rounded-xl font-semibold shadow-[0_8px_20px_rgba(107,156,255,0.3)] hover:-translate-y-0.5 transition-all"
          >
            <CreditCard className="h-5 w-5" />
            Go to Billing
          </Link>
          <a 
            href="https://wa.me/201275976195?text=My subscription has expired and I want to renew."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-2 border-slate-200 dark:border-slate-700 text-foreground px-6 py-3 rounded-xl font-semibold hover:border-[#6B9CFF] transition-colors"
          >
            <AlertCircle className="h-5 w-5 text-green-500" />
            Contact Support
          </a>
        </div>
      </div>
    )
  }

  // 5. لو كل حاجة تمام، اعرض الصفحة عادي
  return <>{children}</>
}