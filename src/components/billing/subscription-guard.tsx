"use client"

import { usePathname } from "next/navigation"
import { AlertCircle, Lock, Clock } from "lucide-react"
import Link from "next/link"

interface SubscriptionGuardProps {
  children: React.ReactNode
  status: string | null
  trialEndsAt: Date | null
  endDate: Date | null
}

export function SubscriptionGuard({ children, status, trialEndsAt, endDate }: SubscriptionGuardProps) {
  const pathname = usePathname()
  
  // لو اليوزر في صفحة الـ Billing، سيبه يشوفها عشان يقدر يدخل كود التفعيل
  if (pathname.includes("/settings/billing")) {
    return <>{children}</>
  }

  const now = new Date()
  let isExpired = false
  let isSuspended = status === "SUSPENDED"
  let message = ""
  let icon = <Lock className="h-12 w-12 text-red-500" />

  // التحقق من انتهاء الصلاحية
  if (status === "TRIAL" && trialEndsAt && new Date(trialEndsAt) < now) {
    isExpired = true
    message = "Your 3-day free trial has expired."
    icon = <Clock className="h-12 w-12 text-orange-500" />
  } else if (status === "ACTIVE" && endDate && new Date(endDate) < now) {
    isExpired = true
    message = "Your subscription has expired."
    icon = <Clock className="h-12 w-12 text-orange-500" />
  } else if (isSuspended) {
    message = "Your account has been suspended by the administration."
  }

  // لو الحساب موقوف أوالاشتراك خلص، اظهر الشاشة الاحمر
  if (isSuspended || isExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-xl border shadow-sm">
        <div className="mb-4">{icon}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isSuspended ? "Account Suspended" : "Subscription Expired"}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {message} Please contact the administrator or activate a subscription code to continue using the system.
        </p>
        <Link 
          href="/settings/billing"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          <AlertCircle className="h-4 w-4" />
          Go to Billing & Activation
        </Link>
      </div>
    )
  }

  // لو كل حاجة تمام، اعرض الداشبورد عادي
  return <>{children}</>
}