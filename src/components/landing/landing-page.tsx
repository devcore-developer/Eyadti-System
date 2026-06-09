import { Navbar } from "./navbar"
import { Hero } from "./hero"
import { MotionWrapper } from "./motion-wrapper"
import Link from "next/link"
import { Check } from "lucide-react"

export function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <Hero />

      {/* ── Features Section ── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionWrapper className="text-center mb-12">
            <span className="text-sm font-semibold tracking-wide uppercase text-[#378ADD]">Features</span>
            <h2 className="mt-2 text-[32px] font-bold tracking-tight text-gray-900">
              Everything you need to run your clinic
            </h2>
          </MotionWrapper>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <MotionWrapper key={feature.title} delay={i * 0.05}>
                <div className={`bg-white p-6 rounded-[12px] h-full flex flex-col border ${
                  feature.highlighted ? 'border-[1.5px] border-[#378ADD]' : 'border-[#E5E7EB]'
                } shadow-[0_1px_3px_rgba(0,0,0,0.06)]`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-[8px] bg-[#F0F6FF] flex items-center justify-center text-[#378ADD]">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    {feature.badge && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-[8px] bg-[#EBF4FF] text-[#185FA5]">
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </MotionWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section id="pricing" className="py-20 bg-[#F8F9FA]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionWrapper className="text-center mb-12">
            <span className="text-sm font-semibold tracking-wide uppercase text-[#378ADD]">Pricing</span>
            <h2 className="mt-2 text-[32px] font-bold tracking-tight text-gray-900">
              Choose the right plan for your clinic
            </h2>
            <p className="mt-3 text-base text-gray-500">
              Start your 14-day free trial today. No credit card required.
            </p>
          </MotionWrapper>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan, i) => (
              <MotionWrapper key={plan.name} delay={i * 0.1}>
                <div className={`bg-white rounded-[12px] border ${
                  plan.featured ? 'border-[2px] border-[#378ADD]' : 'border-[#E5E7EB]'
                } shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col`}>
                  <div className="p-6 border-b border-[#E5E7EB]">
                    {plan.featured && (
                      <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-[8px] bg-[#EBF4FF] text-[#185FA5] mb-3">
                        Most Popular
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
                    <div className="mt-4">
                      <span className="text-[40px] font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-500 text-sm"> EGP/mo</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{plan.yearly}</p>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="h-4 w-4 text-[#5DCAA5] mt-0.5 shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      {plan.featured ? (
                        <Link href="/signup" className="block w-full text-center py-2.5 rounded-[8px] bg-[#378ADD] text-white text-sm font-medium hover:bg-[#2e7ac7] transition-colors">
                          Start Free Trial
                        </Link>
                      ) : (
                        <Link href="/signup" className="block w-full text-center py-2.5 rounded-[8px] border border-[#378ADD] text-[#378ADD] text-sm font-medium hover:bg-[#F0F6FF] transition-colors">
                          Get Started
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </MotionWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionWrapper>
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-8 md:p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <h2 className="text-[32px] font-bold tracking-tight text-gray-900 mb-3">
                Start Managing Your Clinic Professionally Today
              </h2>
              <p className="text-base text-gray-500 mb-8 max-w-lg mx-auto">
                Join hundreds of clinics already using Eyadti to save time, reduce no-shows, and increase revenue.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup" className="inline-flex items-center justify-center gap-2 text-sm font-medium text-white px-6 py-2.5 rounded-[8px] bg-[#378ADD] hover:bg-[#2e7ac7] transition-colors">
                  Start Free Trial
                </Link>
                <a href="https://wa.me/201275976195" target="_blank" className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[#378ADD] px-6 py-2.5 rounded-[8px] border border-[#378ADD] bg-transparent hover:bg-[#F0F6FF] transition-colors">
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </MotionWrapper>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E5E7EB] bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-[6px] bg-[#378ADD] flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Eyadti</span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Eyadti. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

// Data
import { Users, CalendarDays, Clock, Globe, FileText, Receipt, Building2, MessageCircle, BarChart3, Stethoscope } from "lucide-react"

const features = [
  { title: "Patient Management", description: "Comprehensive records, medical history, and attachments for every patient.", icon: Users, highlighted: false, badge: null },
  { title: "Smart Appointments", description: "Intelligent scheduling with conflict detection and reminders.", icon: CalendarDays, highlighted: false, badge: null },
  { title: "Waiting Room Queue", description: "Real-time queue management and TV display support for smoother operations.", icon: Clock, highlighted: false, badge: null },
  { title: "Online Booking", description: "Let patients book 24/7 via your custom booking link.", icon: Globe, highlighted: false, badge: null },
  { title: "Invoices & Billing", description: "Generate invoices, track payments, and manage taxes easily.", icon: Receipt, highlighted: false, badge: null },
  { title: "Prescriptions", description: "Create, print, and share digital prescriptions instantly.", icon: FileText, highlighted: false, badge: null },
  { title: "WhatsApp Automation", description: "Automated reminders and follow-ups via WhatsApp to reduce no-shows.", icon: MessageCircle, highlighted: true, badge: "Pro & above" },
  { title: "Multi-Branch Management", description: "Manage multiple clinics and branches from a single dashboard.", icon: Building2, highlighted: true, badge: "Clinic & above" },
  { title: "Analytics Dashboard", description: "Actionable insights on revenue, patients, and doctor performance.", icon: BarChart3, highlighted: false, badge: null },
]

const plans = [
  {
    name: "Starter",
    desc: "For solo doctors",
    price: "499",
    yearly: "4,990 EGP/year (Save 2 months)",
    featured: false,
    features: ["1 Branch", "Limited Users", "Patients Management", "Appointments", "Prescriptions", "Basic Reports"]
  },
  {
    name: "Professional",
    desc: "For growing clinics",
    price: "999",
    yearly: "9,990 EGP/year (Save 2 months)",
    featured: true,
    features: ["Multi-doctor", "5 Branches", "Waiting room", "Online booking", "Advanced analytics", "Notifications", "Priority support"]
  },
  {
    name: "Clinic",
    desc: "For large centers",
    price: "1,799",
    yearly: "17,990 EGP/year (Save 2 months)",
    featured: false,
    features: ["Multi-branch", "Custom integrations", "Priority support", "API access", "White-label", "SLA", "Dedicated manager"]
  }
]