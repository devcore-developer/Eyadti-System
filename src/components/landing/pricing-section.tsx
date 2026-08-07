import { prisma } from "@/lib/db"
import { Check, X, Zap, Building2, Rocket } from "lucide-react"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { SubscriptionStatus } from "@prisma/client"

// ⬇️⬇️⬇️ قاموس ترجمة الـ Pricing ⬇️⬇⬇️
type PricingStrings = {
  title: string;
  subtitle: string;
  mostPopular: string;
  contactSales: string;
  contactSalesMsg: string;
  startFreeTrial: string;
  upgradeNow: string;
  currentTrial: string;
  currentPlan: string;
  currency: string;
  saveMonths: string;
  branches: string;
  doctors: string;
  users: string;
  monthlyVisits: string;
  onlineBooking: string;
  whatsapp: string;
  analytics: string;
  auditLogs: string;
  gallery: string;
};

const pricingStrings: Record<"en" | "ar", PricingStrings> = {
  en: {
    title: "Choose the Right Plan for Your Clinic",
    subtitle: "Start your 7-day free trial today. No credit card required. Upgrade anytime as your clinic grows.",
    mostPopular: "MOST POPULAR",
    contactSales: "Contact Sales",
    contactSalesMsg: "I'm interested in the Enterprise plan",
    startFreeTrial: "Start Free Trial",
    upgradeNow: "Upgrade Now",
    currentTrial: "Current Trial Plan",
    currentPlan: "Current Plan",
    currency: "EGP / mo",
    saveMonths: "Save 2 months!",
    branches: "Branches",
    doctors: "Doctors",
    users: "Users",
    monthlyVisits: "Monthly Visits",
    onlineBooking: "Online Booking",
    whatsapp: "WhatsApp Automation",
    analytics: "Advanced Analytics",
    auditLogs: "Audit Logs",
    gallery: "Before/After Gallery",
  },
  ar: {
    title: "اختر الخطة المناسبة لعيادتك",
    subtitle: "ابدأ فترة تجريبية مجانية لمدة 7 أيام اليوم. لا حاجة لبطاقة ائتمان. قم بالترقية في أي وقت.",
    mostPopular: "الأكثر شعبية",
    contactSales: "تواصل مع المبيعات",
    contactSalesMsg: "أنا مهتمون بخطة المؤسسة",
    startFreeTrial: "ابدأ تجريبي مجاناً",
    upgradeNow: "ترقية الآن",
    currentTrial: "خطة التجربة الحالية",
    currentPlan: "الخطة الحالية",
    currency: "ج.م / شهر",
    saveMonths: "وفر شهرين!",
    branches: "الفروع",
    doctors: "الأطباء",
    users: "المستخدمين",
    monthlyVisits: "الزيارات الشهرية",
    onlineBooking: "حجز أونلاين",
    whatsapp: "أتمتة واتساب",
    analytics: "تحليلات متقدمة",
    auditLogs: "سجل العمليات",
    gallery: "معرض قبل وبعد",
  }
};

// ⬇️⬇️⬇️ إضافة الـ Props ⬇⬇⬇️
type PricingSectionProps = {
  locale?: "en" | "ar";
};

// دالة مساعدة لعرض القيم
function PlanValue({ value, isBoolean }: { value: boolean | number | null; isBoolean?: boolean }) {
  if (isBoolean) {
    return value ? <Check className="h-5 w-5 text-emerald-500 mx-auto" /> : <X className="h-5 w-5 text-slate-400 mx-auto" />
  }
  if (value === -1 || value === null) return <span className="text-emerald-500 font-bold">Unlimited</span>
  return <span>{value}</span>
}

export default async function PricingSection({ locale = "en" }: PricingSectionProps) {
  const t = pricingStrings[locale];
  
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

  // جلب الباقات النشطة فقط
  const rawPlans = await prisma.plan.findMany({
    where: { active: true, slug: { not: "default-plan" } }
  })

  // ترتيب الباقات
  const planOrder = ['starter', 'pro', 'enterprise'];
  const plans = rawPlans.sort((a, b) => planOrder.indexOf(a.slug) - planOrder.indexOf(b.slug));

  const highlightPlan = "pro"

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0F172A] dark:to-[#17212F] py-20 px-4">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
          {t.title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t.subtitle}
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
                  <Zap className="h-3 w-3" /> {t.mostPopular}
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
                  <div className="text-4xl font-bold text-foreground">{t.contactSales}</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-foreground">{plan.monthlyPrice}</span>
                    <span className="text-muted-foreground">{t.currency}</span>
                  </div>
                )}
                {!isEnterprise && plan.yearlyPrice > 0 && (
                  <p className="text-sm text-emerald-500 mt-1 font-medium">
                    {plan.yearlyPrice} {t.currency.replace("/ mo", "")} / year ({t.saveMonths})
                  </p>
                )}
              </div>

              <div className="mb-8 space-y-3 flex-1">
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.maxBranches} /> <span className="text-muted-foreground">{t.branches}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.maxDoctors} /> <span className="text-muted-foreground">{t.doctors}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.maxUsers} /> <span className="text-muted-foreground">{t.users}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.maxMonthlyVisits} /> <span className="text-muted-foreground">{t.monthlyVisits}</span>
                </div>
                
                <hr className="my-4 border-slate-100 dark:border-slate-700" />

                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.onlineBookingEnabled} isBoolean /> <span className="text-muted-foreground">{t.onlineBooking}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.whatsappEnabled} isBoolean /> <span className="text-muted-foreground">{t.whatsapp}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.analyticsEnabled} isBoolean /> <span className="text-muted-foreground">{t.analytics}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.auditLogsEnabled} isBoolean /> <span className="text-muted-foreground">{t.auditLogs}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <PlanValue value={plan.galleryEnabled} isBoolean /> <span className="text-muted-foreground">{t.gallery}</span>
                </div>
              </div>

              <div>
                {isCurrent ? (
                  <button disabled className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                    {isTrial ? t.currentTrial : t.currentPlan}
                  </button>
                ) : isEnterprise ? (
                  <a href={`https://wa.me/201275976195?text=${encodeURIComponent(t.contactSalesMsg)}`} target="_blank" className="block w-full py-3 px-4 rounded-xl border-2 border-amber-500 text-amber-600 font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-center">
                    {t.contactSales}
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
                    {currentClinicId ? t.upgradeNow : t.startFreeTrial}
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