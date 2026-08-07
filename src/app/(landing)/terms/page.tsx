"use client"

import { useState, useEffect, useRef } from "react"
import { FileText, CalendarDays } from "lucide-react"
import { Navbar } from "@/components/landing/navbar"
import FooterSection from "@/components/landing/footer-section"

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using Nexora Clinic System ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree with these terms, you must not use the Service. These terms constitute a legally binding agreement between you ("User") and Nexora ("Company"). "Clinic" refers to the healthcare facility or medical center using the Service, represented by the registered administrator account.`,
  },
  {
    id: "service-description",
    title: "2. Service Description",
    content: `Nexora is a cloud-based clinic management SaaS platform that provides tools for patient record management, appointment scheduling, waiting room queue management, online booking, invoicing and billing, prescription management, multi-branch support, analytics dashboards, WhatsApp integration, and related healthcare management features. The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.`,
  },
  {
    id: "account-registration",
    title: "3. Account Registration",
    content: `To use the Service, you must register for an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials. Each clinic should have only one active admin account unless otherwise authorized by the Company. You must be at least 18 years old and have legal capacity to enter into these terms. You are responsible for all activities under your account. The Company reserves the right to suspend accounts that violate these terms.`,
  },
  {
    id: "trial-period",
    title: "4. Trial Period",
    content: `New clinics may be eligible for a 7-day free trial period with access to Standard plan features. The trial begins upon registration and cannot be extended except by the Company. No credit card is required to start the trial. At the end of the trial, you must activate a valid subscription code to continue using the Service. Trial data is preserved if you upgrade to a paid plan. The Company may modify trial terms at its discretion.`,
  },
  {
    id: "subscription-payments",
    title: "5. Subscription & Payments",
    content: `Paid subscriptions are available in three tiers: Standard (600 EGP/month), Professional (1,000 EGP/month), and Enterprise (starting from 2,000 EGP/month). Prices are in Egyptian Pounds (EGP). Subscription fees are billed in advance for the selected billing cycle (monthly or yearly). The Company reserves the right to change pricing with 30 days written notice. Your continued use after the notice period constitutes acceptance of the new pricing. All payments are non-refundable except as required by applicable consumer protection laws.`,
  },
  {
    id: "plan-features",
    title: "6. Plan Features & Limitations",
    content: `Each subscription plan includes specific features and limitations. Standard includes basic patient management, appointments, waiting room, online booking, basic invoicing, and basic prescriptions. Professional adds doctor attendance, advanced analytics, WhatsApp integration, audit logs, gallery, and advanced features. Enterprise includes everything in Professional plus higher limits, custom configurations, and priority support. Feature availability is determined by your active subscription plan. Attempting to use features outside your plan will result in an upgrade prompt. The Company reserves the right to modify feature allocations between plans.`,
  },
  {
    id: "acceptable-use",
    title: "7. Acceptable Use",
    content: `You agree to use the Service only for lawful healthcare clinic management purposes. You agree NOT to: (a) use the Service for any illegal purpose; (b) attempt to reverse engineer, decompile, or disassemble the Service; (c) interfere with the Service's infrastructure or security; (d) attempt to gain unauthorized access; (e) use automated systems to scrape data; (f) resell, sublicense, or redistribute the Service; (g) use the Service to compete directly with Nexora. Violation may result in immediate account termination without refund.`,
  },
  {
    id: "user-content",
    title: "8. User Content Responsibility",
    content: `You retain ownership of all data you input into the system (patient records, prescriptions, invoices, etc.). You are solely responsible for the accuracy, legality, and appropriateness of content you create. You represent and warrant that you have proper authorization to create and manage patient records. The Company is not liable for user-generated content. You grant the Company a non-exclusive, worldwide, royalty-free license to use, store, and process your content solely for providing the Service.`,
  },
  {
    id: "intellectual-property",
    title: "9. Intellectual Property",
    content: `All content, logos, trademarks, graphics, and software in the Service are owned by or licensed to the Company. "Nexora," the Nexora logo, and related branding are trademarks of the Company. You may not use these marks without written permission. The Service layout, design, and code are protected by copyright. You may not copy, modify, distribute, or create derivative works without explicit authorization.`,
  },
  {
    id: "prohibited-activities",
    title: "10. Prohibited Activities",
    content: `Without prior written authorization, you may NOT: (a) host the Service as a SaaS reseller; (b) create a white-label version; (c) provide the Service to third parties as a service; (d) bypass license or security measures; (e) use the Service for high-risk activities not approved by the Company; (f) create competing products based on our design. The Company reserves all rights not expressly granted in these terms.`,
  },
  {
    id: "service-availability",
    title: "11. Service Availability",
    content: `The Company strives to maintain 99.9% uptime but does not guarantee uninterrupted access. We may perform maintenance, updates, or modifications at any time with reasonable notice. We are not liable for any downtime, data loss, or damages resulting from service interruptions. We may temporarily suspend the Service for maintenance, security patches, or emergency fixes without prior notice in critical situations.`,
  },
  {
    id: "termination",
    title: "12. Termination",
    content: `Either party may terminate this agreement with written notice. You may terminate at any time by canceling your subscription through the dashboard. The Company may terminate immediately for: (a) Terms violations; (b) illegal use; (c) security breaches; (d) extended inactivity. Upon termination, your right to access the Service ends immediately. Data is retained per the Privacy Policy. No partial refunds are provided for unused periods except as required by law.`,
  },
  {
    id: "limitation-liability",
    title: "13. Limitation of Liability",
    content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE COMPANY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO: LOSS OF PROFITS, DATA, GOODWILL, BUSINESS OPPORTUNITY, OR INTERRUPTION OF BUSINESS. THE COMPANY'S TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE PAST 12 MONTHS. THIS LIMITATION APPLIES REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, STRICT LIABILITY, OR OTHERWISE).`,
  },
  {
    id: "indemnification",
    title: "14. Indemnification",
    content: `To the fullest extent permitted by law, you agree to indemnify and hold harmless the Company, its officers, directors, employees, agents, and affiliates from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from: (a) your use of the Service; (b) your content; (c) your violation of these terms; (d) your violation of any laws; (e) infringement of third-party rights.`,
  },
  {
    id: "governing-law",
    title: "15. Governing Law & Dispute Resolution",
    content: `These terms are governed by Arab Republic of Egypt law, without regard to conflict of law principles. Any disputes shall be resolved first through good-faith negotiations, then through arbitration administered by the Egyptian arbitration center if required. Arbitration shall be conducted in Cairo, Egypt, in Arabic language. Each party shall bear its own costs. The arbitrator's decision shall be final and binding.`,
  },
  {
    id: "general-provisions",
    title: "16. General Provisions",
    content: `If any provision is found unenforceable or invalid, that provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall remain in full effect. The Company's failure to enforce any right does not constitute a waiver of that right. No waiver of any breach shall constitute a waiver of any other breach. These terms represent the entire agreement between you and the Company regarding the Service, superseding any prior agreements.`,
  },
  {
    id: "contact",
    title: "17. Contact Information",
    content: `For questions about these terms, contact: Legal inquiries: legal@nexora.app. For technical support: support@nexora.app. For sales: sales@nexora.app. For emergency security issues: security@nexora.app. Official communications will be sent from @nexora.app email addresses.`,
  },
]

function TableOfContents({ activeId }: { activeId: string }) {
  return (
    <nav className="sticky top-24">
      <h3
        className="text-[11px] font-semibold uppercase tracking-widest mb-4 text-slate-400"
      >
        Contents
      </h3>
      <ol className="space-y-0.5">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`block py-[15px] pl-4 text-[13px] transition-all duration-150 border-l-2 border-transparent hover:border-blue-400 hover:text-blue-600 rounded-lg ${
                activeId === section.id
                  ? "text-blue-600 border-blue-400 bg-blue-50/50 font-medium"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              style={{ borderLeftWidth: "2px" }}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default function TermsPage() {
  const lastUpdated = "August 7, 2026"
  const [activeSection, setActiveSection] = useState<string>("")
  // تم تعديل السطر التالي لإصلاح خطأ TypeScript
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    sections.forEach((section) => {
      const ref = document.getElementById(section.id)
      sectionRefs.current.push(ref)
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: "-20%" }
    )

    sections.forEach((section, index) => {
      if (sectionRefs.current[index]) {
        observer.observe(sectionRefs.current[index])
      }
    })

    return () => {
      observers.forEach((o) => o.disconnect())
    }
  }, [sections])

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ backgroundColor: "#F7FAFC" }}>
        {/* Hero */}
        <section className="pt-16 md:pt-20 pb-6 md:pb-8 px-5 md:px-8">
          <div className="max-w-[1150px] mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-xl"
                style={{ backgroundColor: "#EFF6FF" }}
              >
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h1
              className="text-[40px] md:text-[44px] font-bold leading-[1.1] mb-3"
              style={{ color: "#0F172A" }}
            >
              Terms & Conditions
            </h1>
            <p
              className="text-[16px] leading-[1.6] max-w-[600px] mx-auto mb-2"
              style={{ color: "#64748B" }}
            >
              Please read these terms carefully before using Nexora Clinic System.
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[13px]" style={{ color: "#94A3B8" }}>
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="pt-4 md:pt-6 pb-16 md:pb-24 px-5 md:px-8">
          <div className="max-w-[1150px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-10">
              {/* Table of Contents - Desktop */}
              <div className="hidden lg:block w-[220px]">
                <TableOfContents activeId={activeSection} />
              </div>

              {/* Document */}
              <div
                className="flex-1 bg-white rounded-[18px] border p-6 md:p-10 lg:p-12"
                style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.02)" }}
              >
                <div className="prose max-w-none" style={{ color: "#334155" }}>
                  {sections.map((section, index) => (
                    <section
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-16 first:mt-0"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-[12px] font-bold"
                          style={{ backgroundColor: "#3B82F6" }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h2
                          className="text-[20px] md:text-[22px] font-bold leading-[1.3] text-slate-900"
                        >
                          {section.title}
                        </h2>
                      </div>
                      <div
                        className="text-[15px] leading-[1.8] whitespace-pre-wrap text-slate-700"
                      >
                        {section.content}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <FooterSection />
      </main>
    </>
  )
}