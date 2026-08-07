import { Navbar } from "./navbar"
import { Hero } from "./hero"
import { MotionWrapper } from "./motion-wrapper"
import PricingSection from "./pricing-section"
import Link from "next/link"
import FaqSection from "./faq-section"
import TestimonialsSection from "@/components/landing/testimonials-section"
import CtaSection from "@/components/landing/cta-section"
import FooterSection from "@/components/landing/footer-section"
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

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FaqSection />

      {/* CTA Section */}
      <CtaSection />

      {/* Footer */}
      <FooterSection />
    </main>
  )
}