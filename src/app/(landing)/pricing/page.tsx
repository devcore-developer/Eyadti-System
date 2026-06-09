import { prisma } from "@/lib/db"
import { Check, X, Zap, Building2, Rocket } from "lucide-react"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { SubscriptionStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

// دالة مساعدة لعرض القيم
function PlanValue({ value, isBoolean }: { value: boolean | number | null; isBoolean?: boolean }) {
  if (isBoolean) {
    return value ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> : <X className="h-5 w-5 text-slate-400 mx-auto" />
  }
  if (value === -1 || value === null) return <span className="text-emerald-500 font-bold">Unlimited</span>
  return <span>{value}</span>
}

export default async function PricingPage() {
  const session = await auth()
  const currentClinicId = session?.user?.clinicId
  
  let currentPlanSlug = null
  let isTrial = false

  if (currentClinicId) {
    const subscription = await prisma.subscription.findUnique({
      where: { clinicId: currentClinicId },
      select: { planId: true, status: true, plan: { select: { slug: true } } }
    })
    if (subscription) {
      currentPlanSlug = subscription.plan.slug
      isTrial = subscription.status === SubscriptionStatus.TRIAL
    }
  }

  // جلب الباقات النشطة فقط (باستثناء الـ default-plan لو لسه موجود)
  const rawPlans = await prisma.plan.findMany({
    where: { active: true, slug: { not: "default-plan" } }
  })

  // ✅ ترتيب الباقات بالظبط زي ما انت عايز
  const planOrder = ['starter', 'pro', 'enterprise'];
  const plans = rawPlans.sort((a, b) => planOrder.indexOf(a.slug) - planOrder.indexOf(b.slug));

  const highlightPlan = "pro" // الباقة الأكثر شيوعاً

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0F172A] dark:to-[#17212F] py-20 px-4">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
          Choose the Right Plan for Your Clinic
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start your 10-day free trial today. No credit card required. Upgrade anytime as your clinic grows.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {plans.map((plan) => {
          const isHighlighted = plan.slug === highlightPlan
          const isCurrent = plan.slug === currentPlanSlug
          const isEnterprise = plan.slug === "enterprise"

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 flex flex-col transition-all duration-300 ${
                isHighlighted
                  ? "bg-white dark:bg-[#1A2332] border-[#6B9CFF] shadow-[0_20px_60px_rgba(107,156,255,0.2)] scale-105 z-10"
                  : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700/50 shadow-lg"
              }`}
            >
              {isHighlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md flex items-center gap-1">
                  <Zap className="h-3 w-3" /> MOST POPULAR
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  {plan.slug === "starter" && <Rocket className="h-6 w-6 text-slate-500" />}
                  {plan.slug === "pro" && <Building2 className="h-6 w-6 text-[#6B9CFF]" />}
                  {plan.slug === "enterprise" && <Zap className="h-6 w-6 text-amber-500" />}
                  <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground h-10">{plan.description}</p>
              </div>

              <div className="mb-8">
                {isEnterprise ? (
                  <div className="text-4xl font-bold text-foreground">Contact Sales</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-foreground">{plan.monthlyPrice}</span>
                    <span className="text-muted-foreground">EGP / mo</span>
                  </div>
                )}
                {!isEnterprise && plan.yearlyPrice > 0 && (
                  <p className="text-sm text-emerald-500 mt-1 font-medium">
                    {plan.yearlyPrice} EGP / year (Save 2 months!)
                  </p>
                )}
              </div>

              <div className="mb-8 space-y-3 flex-1">
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.maxBranches} /> <span className="text-muted-foreground">Branches</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.maxDoctors} /> <span className="text-muted-foreground">Doctors</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.maxUsers} /> <span className="text-muted-foreground">Users</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.maxMonthlyVisits} /> <span className="text-muted-foreground">Monthly Visits</span>
                </div>
                
                <hr className="my-4 border-slate-100 dark:border-slate-700" />

                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.onlineBookingEnabled} isBoolean /> <span className="text-muted-foreground">Online Booking</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.whatsappEnabled} isBoolean /> <span className="text-muted-foreground">WhatsApp Automation</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.analyticsEnabled} isBoolean /> <span className="text-muted-foreground">Advanced Analytics</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.auditLogsEnabled} isBoolean /> <span className="text-muted-foreground">Audit Logs</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.galleryEnabled} isBoolean /> <span className="text-muted-foreground">Before/After Gallery</span>
                </div>
              </div>

              <div>
                {isCurrent ? (
                  <button disabled className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                    {isTrial ? "Current Trial Plan" : "Current Plan"}
                  </button>
                ) : isEnterprise ? (
                  <a href="https://wa.me/201275976195?text=I'm interested in the Enterprise plan" target="_blank" className="block w-full py-3 px-4 rounded-xl border-2 border-amber-500 text-amber-600 font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-center">
                    Contact Sales
                  </a>
                ) : (
                  <Link 
                    href={currentClinicId ? "/settings/billing" : `/signup`} 
                    className={`block w-full py-3 px-4 rounded-xl font-semibold text-center transition-all duration-200 ${
                      isHighlighted 
                        ? "bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-[0_8px_20px_rgba(107,156,255,0.3)] hover:-translate-y-0.5" 
                        : "border-2 border-slate-200 dark:border-slate-700 text-foreground hover:border-[#6B9CFF]"
                    }`}
                  >
                    {currentClinicId ? "Upgrade Now" : "Start Free Trial"}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}