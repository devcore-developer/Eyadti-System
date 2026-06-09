import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getUsageStats } from "@/lib/services/usage-limits"
import { SubscriptionStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Building2, Users, UserCheck, Stethoscope, Activity, CreditCard, Zap } from "lucide-react"
import Link from "next/link"
import { SUBSCRIPTION_STATUS_COLORS, SUBSCRIPTION_STATUS_LABELS } from "@/lib/constants/features"
import { RedeemForm } from "@/components/subscription/redeem-form"
import { differenceInDays } from "date-fns"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

const ICON_MAP: Record<string, React.ElementType> = {
  Stethoscope,
  Users,
  UserCheck,
  Building2,
  Activity,
}

export default async function BillingPage() {
  const session = await auth()
  const clinicId = session?.user?.clinicId

  if (!clinicId) {
    redirect("/login")
  }

  // 1. جلب بيانات الاشتراك والباقة
  const subscription = await prisma.subscription.findUnique({
    where: { clinicId },
    include: { plan: true },
  })

  // 2. جلب الإحصائيات الحالية (الاستهلاك)
  const usageStats = await getUsageStats(clinicId)

  if (!subscription || !subscription.plan) {
    return (
      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Subscription</h2>
          <p className="text-gray-500 mb-6">Please enter an activation code or contact support.</p>
          <div className="max-w-md mx-auto">
            <RedeemForm clinicId={clinicId} />
          </div>
        </div>
      </div>
    )
  }

  const isTrial = subscription.status === SubscriptionStatus.TRIAL
  const isActive = subscription.status === SubscriptionStatus.ACTIVE
  const isExpired = subscription.status === SubscriptionStatus.EXPIRED || subscription.status === SubscriptionStatus.SUSPENDED
  const statusLabel = SUBSCRIPTION_STATUS_LABELS[subscription.status]
  const statusColor = SUBSCRIPTION_STATUS_COLORS[subscription.status]

  // حساب الأيام المتبقية
  let daysRemaining = 0
  if (isTrial && subscription.trialEndsAt) {
    const remaining = differenceInDays(new Date(subscription.trialEndsAt), new Date())
    daysRemaining = remaining > 0 ? remaining : 0
  } else if (isActive && subscription.currentPeriodEnd) {
    const remaining = differenceInDays(new Date(subscription.currentPeriodEnd), new Date())
    daysRemaining = remaining > 0 ? remaining : 0
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-6">
      
      {/* ── Trial Alert ── */}
      {isTrial && daysRemaining > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-800 dark:text-amber-200 text-lg">Free Trial Active 🚀</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                You have <span className="font-black text-xl">{daysRemaining}</span> days remaining in your free trial. Upgrade or activate a code to keep all features.
              </p>
            </div>
          </div>
          <RedeemForm clinicId={clinicId} />
        </div>
      )}

      {/* ── Expired Alert ── */}
      {isExpired && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-200 text-lg">Subscription Expired ⛔</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">Your subscription has ended. Activate a code to continue using the system.</p>
            </div>
          </div>
          <RedeemForm clinicId={clinicId} />
        </div>
      )}

      {/* ── Active Alert ── */}
      {isActive && daysRemaining > 0 && !isExpired && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Subscription Active ✅ — Renews in <strong>{daysRemaining}</strong> days
          </p>
        </div>
      )}

      {/* ── Current Plan Card ── */}
      <Card className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700/50 shadow-sm">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-lg text-muted-foreground">Current Plan</CardTitle>
          <Badge variant="outline" className={`px-3 py-1 text-sm font-semibold border ${statusColor}`}>
            {statusLabel}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{subscription.plan.name} Plan</h2>
            <p className="text-sm text-muted-foreground mt-1">{subscription.plan.description}</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            {subscription.plan.monthlyPrice > 0 ? (
              <>
                <div className="text-3xl font-bold text-foreground">{subscription.plan.monthlyPrice} <span className="text-base font-normal text-muted-foreground">EGP/mo</span></div>
                <p className="text-xs text-muted-foreground">or {subscription.plan.yearlyPrice} EGP/year</p>
              </>
            ) : (
              <div className="text-3xl font-bold text-foreground">Custom</div>
            )}
            <Link 
              href="/pricing" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:-translate-y-0.5 transition-all text-sm mt-2"
            >
              <Zap className="h-4 w-4" /> Upgrade Plan
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ── Usage Stats Grid ── */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Current Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usageStats.map((stat) => {
            const Icon = ICON_MAP[stat.icon] || Activity
            const isUnlimited = stat.limit === null
            const usagePercent = isUnlimited ? 0 : Math.min(100, (stat.current / (stat.limit || 1)) * 100)
            const isNearLimit = !isUnlimited && usagePercent >= 80

            return (
              <Card key={stat.resource} className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700/50 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Icon className="h-4 w-4 text-[#6B9CFF]" />
                      {stat.label}
                    </div>
                    {isNearLimit && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">Near Limit</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold text-foreground">{stat.current}</span>
                    <span className="text-sm text-muted-foreground">
                      / {isUnlimited ? "Unlimited" : stat.limit}
                    </span>
                  </div>

                  {!isUnlimited && (
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${isNearLimit ? 'bg-red-500' : 'bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF]'}`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ── Redeem Code Section ── */}
      <Card className="bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#5BC0BE]" />
            Redeem Activation Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            If you have received a subscription activation code, enter it below to upgrade your plan or extend your billing period.
          </p>
          <RedeemForm clinicId={clinicId} />
        </CardContent>
      </Card>

    </div>
  )
}