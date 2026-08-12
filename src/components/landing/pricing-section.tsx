// src/components/landing/pricing-section.tsx

import { prisma } from "@/lib/db"
import { Check, X, Building2, Stethoscope, Users, Activity, GitBranch, ShieldCheck, Headphones, CreditCard, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { SubscriptionStatus } from "@prisma/client"
import { TRIAL_DURATION_DAYS } from "@/lib/constants/features"

const limitIcons: Record<string, React.ReactNode> = {
  Branches: <GitBranch className="w-3.5 h-3.5" />,
  Doctors: <Stethoscope className="w-3.5 h-3.5" />,
  Users: <Users className="w-3.5 h-3.5" />,
  "Monthly Visits": <Activity className="w-3.5 h-3.5" />,
}

const planIcons: Record<string, React.ReactNode> = {
  standard: <Building2 className="w-5 h-5 text-muted-foreground" />,
  professional: <Sparkles className="w-5 h-5 text-primary" />,
  enterprise: <Building2 className="w-5 h-5 text-warning" />,
}

const planIconBgs: Record<string, string> = {
  standard: "bg-muted",
  professional: "bg-primary/10",
  enterprise: "bg-warning/10",
}

const featuresList = [
  { key: "Patient Management", isCore: true },
  { key: "Medical Files", isCore: true },
  { key: "Digital Prescriptions", isCore: true },
  { key: "Appointments", isCore: true },
  { key: "Invoices & Billing", isCore: true },
  { key: "Advanced Analytics", planField: "analyticsEnabled" },
  { key: "Online Booking", planField: "onlineBookingEnabled" },
  { key: "Doctor Attendance", planField: "doctorAttendanceEnabled" },
  { key: "WhatsApp Automation", planField: "whatsappEnabled" },
  { key: "Audit Logs", planField: "auditLogsEnabled" },
  { key: "Before/After Gallery", planField: "galleryEnabled" },
]

function PlanValue({ value, isEnterprise }: { value: boolean | number | null; isEnterprise?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-success/10">
        <Check className="w-3.5 h-3.5 text-success" strokeWidth={2.5} />
      </span>
    ) : (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-destructive/10">
        <X className="w-3.5 h-3.5 text-destructive" strokeWidth={2.5} />
      </span>
    )
  }
  if (value === -1 || value === null) {
    return (
      <span className={`font-bold text-sm ${isEnterprise ? "text-warning" : "text-primary"}`}>
        {isEnterprise ? "Custom" : "Unlimited"}
      </span>
    )
  }
  return <span className="font-semibold text-sm text-foreground">{value}</span>
}

const getFeatureValue = (feature: any, plan: any, isEnterprise: boolean) => {
  if (feature.isCore) return true
  if (isEnterprise) return true
  if (feature.planField) {
    const val = plan[feature.planField as keyof typeof plan]
    return typeof val === "boolean" ? val : false
  }
  return false
}

export default async function PricingSection() {
  const session = await auth()
  const currentClinicId = session?.user?.clinicId

  let currentPlanSlug: string | null = null
  let isTrial = false

  if (currentClinicId) {
    const subscription = await prisma.subscription.findUnique({
      where: { clinicId: currentClinicId },
      select: { planId: true, status: true, plan: { select: { slug: true } } },
    })
    if (subscription) {
      currentPlanSlug = subscription.plan.slug
      isTrial = subscription.status === SubscriptionStatus.TRIAL
    }
  }

  const rawPlans = await prisma.plan.findMany({
    where: { active: true, slug: { in: ["standard", "professional", "enterprise"] } },
  })

  const planOrder = ["standard", "professional", "enterprise"]
  const plans = rawPlans.sort((a, b) => planOrder.indexOf(a.slug) - planOrder.indexOf(b.slug))

  const trustItems = [
    { icon: <CreditCard className="w-4 h-4 text-muted-foreground" />, title: "No credit card required", desc: "Start free" },
    { icon: <ShieldCheck className="w-4 h-4 text-muted-foreground" />, title: "Secure & Reliable", desc: "HIPAA-ready" },
    { icon: <Headphones className="w-4 h-4 text-muted-foreground" />, title: "24/7 Support", desc: "Always here" },
    { icon: <ArrowRight className="w-4 h-4 text-muted-foreground" />, title: "Upgrade Anytime", desc: "No lock-in" },
  ]

  return (
    <section id="pricing" className="relative bg-muted/30">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-20 md:py-24">
        {/* Header */}
        <div className="text-center mb-14 md:mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
            Simple, transparent pricing
          </span>
          <h2 className="text-[36px] md:text-[42px] font-extrabold leading-[1.1] mb-5 text-foreground">
            Choose the Right Plan for Your Clinic
          </h2>
          <p className="text-base md:text-[17px] leading-relaxed max-w-[660px] mx-auto text-muted-foreground">
            Start your {TRIAL_DURATION_DAYS}-day free trial today. No credit card required.
            Upgrade anytime as your clinic grows.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const isHighlighted = plan.slug === "professional"
            const isCurrent = plan.slug === currentPlanSlug
            const isEnterprise = plan.slug === "enterprise"

            return (
              <div
                key={plan.id}
                className={`
                  relative bg-card rounded-[22px] p-7 md:p-8 flex flex-col
                  transition-all duration-200 ease-out
                  hover:-translate-y-0.5
                  ${
                    isHighlighted
                      ? "border-2 border-primary shadow-[0_0_0_1px_rgba(91,192,190,0.1),0_8px_40px_rgba(91,192,190,0.08)] z-10"
                      : "border border-border"
                  }
                `}
              >
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[12px] font-bold tracking-wide text-primary-foreground bg-primary shadow-md">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${planIconBgs[plan.slug] || "bg-muted"}`}>
                    {planIcons[plan.slug]}
                  </div>
                  <div>
                    <h3 className="text-[22px] font-bold leading-tight text-foreground">
                      {plan.name}
                    </h3>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-9 text-muted-foreground">
                  {plan.description}
                </p>

                <div className="mb-9">
                  {isEnterprise ? (
                    <div>
                      <p className="text-sm font-medium mb-1 text-muted-foreground">Starting from</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[52px] font-extrabold leading-none text-foreground">
                          {plan.monthlyPrice.toLocaleString()}
                        </span>
                        <span className="text-[15px] font-medium text-muted-foreground">EGP / mo</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[52px] font-extrabold leading-none text-foreground">
                          {plan.monthlyPrice.toLocaleString()}
                        </span>
                        <span className="text-[15px] font-medium text-muted-foreground">EGP / mo</span>
                      </div>
                      {plan.yearlyPrice > 0 && (
                        <p className="text-[13px] font-medium mt-2 text-success">
                          {plan.yearlyPrice.toLocaleString()} EGP / year — Save 2 months
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-0 mb-8 pb-8 border-b border-border">
                  {(["Branches", "Doctors", "Users", "Monthly Visits"] as const).map((label) => {
                    const value =
                      label === "Branches" ? plan.maxBranches :
                      label === "Doctors" ? plan.maxDoctors :
                      label === "Users" ? plan.maxUsers :
                      plan.maxMonthlyVisits

                    return (
                      <div key={label} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-muted-foreground">{limitIcons[label]}</span>
                          <span className="text-[14px] text-muted-foreground">{label}</span>
                        </div>
                        {isEnterprise ? (
                          <span className="font-bold text-sm text-warning">Customized</span>
                        ) : (
                          <PlanValue value={value} />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Features Matrix */}
                <div className="space-y-0 mb-8 flex-1">
                  {featuresList.map((feature: any) => {
                    const isIncluded = getFeatureValue(feature, plan, isEnterprise)

                    return (
                      <div key={feature.key} className="flex items-center justify-between py-2.5">
                        <span className="text-[14px] text-foreground/70">{feature.key}</span>
                        <PlanValue value={isIncluded} isEnterprise={isEnterprise} />
                      </div>
                    )
                  })}
                </div>

                <div className="mt-auto pt-2">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full h-[50px] rounded-[13px] text-[15px] font-semibold border-2 border-border text-muted-foreground cursor-not-allowed"
                    >
                      {isTrial ? "Current Trial Plan" : "Current Plan"}
                    </button>
                  ) : isEnterprise ? (
                    <a
                      href="https://wa.me/201275976195?text=I'm interested in the Enterprise plan"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-[50px] rounded-[13px] text-[15px] font-semibold border-2 border-warning text-warning hover:bg-warning/10 transition-colors duration-200"
                    >
                      Contact Sales
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link
                      href={currentClinicId ? "/settings/billing" : "/signup"}
                      className={`
                        flex items-center justify-center gap-2 w-full h-[50px] rounded-[13px] text-[15px] font-semibold
                        transition-all duration-200 ease-out hover:-translate-y-px
                        ${isHighlighted ? "text-primary-foreground bg-primary shadow-md hover:shadow-lg" : "border-2 border-primary text-primary hover:bg-primary/10"}
                      `}
                    >
                      {currentClinicId ? "Upgrade Now" : "Start Free Trial"}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 md:mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[900px] mx-auto">
          {trustItems.map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center gap-1.5 py-3">
              {item.icon}
              <span className="text-[13px] font-semibold text-foreground/70">{item.title}</span>
              <span className="text-[12px] text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}