import { Navbar } from "./navbar"
import { Hero } from "./hero"
import { MotionWrapper } from "./motion-wrapper"
import PricingSection from "./pricing-section" // سنستخدم صفحة الباقات التي بنيناها مسبقاً
import Link from "next/link"

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionWrapper className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">
              Everything you need to run your clinic
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From patient records to billing, manage it all in one place.
            </p>
          </MotionWrapper>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <MotionWrapper key={feature.title} delay={i * 0.1}>
                <div className="premium-card p-6 h-full flex flex-col">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#5BC0BE]/20 to-[#6B9CFF]/20 flex items-center justify-center mb-4 text-[#6B9CFF]">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </MotionWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 bg-muted/30">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PricingSection /> 
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <MotionWrapper>
            <div className="premium-card p-12 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#5BC0BE]/5 to-[#6B9CFF]/5" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
                  Start Managing Your Clinic Professionally Today
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join hundreds of clinics already using Nexora to save time, reduce no-shows, and increase revenue.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/signup" className="inline-flex items-center justify-center gap-2 font-semibold text-white px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] shadow-[0_15px_35px_rgba(107,156,255,0.3)] hover:-translate-y-0.5 transition-all">
                    Start Free Trial
                  </Link>
                  <a href="https://wa.me/201275976195" target="_blank" className="inline-flex items-center justify-center gap-2 font-semibold text-foreground px-8 py-3.5 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                    Contact Sales
                  </a>
                </div>
              </div>
            </div>
          </MotionWrapper>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-foreground">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF] flex items-center justify-center">
              {/* Logo icon */}
            </div>
            <span className="font-bold">Nexora</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nexora. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

// Data for features
import { Users, CalendarDays, Clock, Globe, FileText, Receipt, Building2, BarChart3, Bell } from "lucide-react"
const features = [
  { title: "Patient Management", description: "Comprehensive records, medical history, and attachments for every patient.", icon: Users },
  { title: "Smart Appointments", description: "Intelligent scheduling with conflict detection and reminders.", icon: CalendarDays },
  { title: "Waiting Room Queue", description: "Real-time queue management and TV display support.", icon: Clock },
  { title: "Online Booking", description: "Let patients book 24/7 via your custom booking link.", icon: Globe },
  { title: "Invoices & Billing", description: "Generate invoices, track payments, and manage taxes easily.", icon: Receipt },
  { title: "Prescriptions", description: "Create, print, and share digital prescriptions instantly.", icon: FileText },
  { title: "Branch Management", description: "Manage multiple clinics and branches from one dashboard.", icon: Building2 },
  { title: "Analytics Dashboard", description: "Actionable insights on revenue, patients, and doctor performance.", icon: BarChart3 },
  { title: "WhatsApp Notifications", description: "Automated reminders and follow-ups via WhatsApp & SMS.", icon: Bell },
]