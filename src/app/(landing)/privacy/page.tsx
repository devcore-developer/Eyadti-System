"use client"

import { useState, useEffect, useRef } from "react"
import { ShieldCheck, CalendarDays } from "lucide-react"
import { Navbar } from "@/components/landing/navbar"
import FooterSection from "@/components/landing/footer-section"

const sections = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    content: `We collect information you provide directly when using Nexora Clinic System, including your name, email address, phone number, and clinic details when you register. We also collect patient information you enter such as names, contact details, medical history, allergies, diagnoses, prescriptions, visit notes, and attachments like medical images and documents. Additionally, we automatically collect technical data including your IP address, browser type, device information, pages visited, time spent on pages, and referring URLs.`,
  },
  {
    id: "how-we-use-information",
    title: "2. How We Use Your Information",
    content: `We use the collected information to provide, maintain, and improve Nexora Clinic System's core services: managing patient records, scheduling appointments, processing invoices, sending notifications, and generating reports. Your clinic data is used to populate dashboards, analytics, and operational reports. Contact information is used for account management, support communications, and delivering important service notifications. We use technical data for analytics, performance monitoring, security auditing, and improving user experience across the platform.`,
  },
  {
    id: "data-storage-security",
    title: "3. Data Storage & Security",
    content: `All data is stored securely on encrypted cloud servers with industry-standard protection measures. We implement encryption at rest and in transit using TLS/SSL protocols. Access to patient data is strictly controlled through role-based permissions within each clinic. We maintain regular security audits, vulnerability assessments, and follow healthcare data protection best practices. Our infrastructure is hosted on secure data centers with physical security controls, regular backups, and disaster recovery procedures.`,
  },
  {
    id: "data-sharing",
    title: "4. Data Sharing & Third Parties",
    content: `We do not sell, rent, or trade your clinic or patient data to third parties for marketing purposes. We may share limited technical and operational data with service providers who help us operate the platform, such as cloud hosting providers, payment processors, and communication services (WhatsApp, SMS providers). These partners are contractually obligated to maintain data confidentiality and are prohibited from using your data for their own purposes. We may share anonymized, aggregated statistics for platform analytics that cannot identify individual clinics or patients.`,
  },
  {
    id: "cookies-tracking",
    title: "5. Cookies & Tracking Technologies",
    content: `We use essential cookies to maintain your session, remember your preferences, and enable core functionality. Analytics cookies help us understand how the platform is used to improve our services. We may use third-party analytics tools that set their own cookies to help us analyze usage patterns. You can control cookie preferences through your browser settings. We do not use advertising cookies or tracking pixels from external ad networks.`,
  },
  {
    id: "data-retention",
    title: "6. Data Retention",
    content: `We retain your clinic and patient data for as long as your account is active. If you delete specific patient records, they are permanently removed from our system within 30 days. If you terminate your subscription, your data is retained for 90 days before permanent deletion, giving you time to export or reactivate. Anonymized usage statistics may be retained indefinitely for analytical purposes. Trial account data is deleted after 30 days of inactivity if not converted to a paid subscription.`,
  },
  {
    id: "your-rights",
    title: "7. Your Rights",
    content: `You have the right to access, view, export, and delete your clinic and patient data at any time through the dashboard. You can request a complete data export in a standard format (JSON) for portability. You can correct inaccurate patient information. You can object to certain data processing activities. You can request deletion of your account and associated data, subject to our retention policy. You have the right to receive a copy of your data upon request.`,
  },
  {
    id: "data-breaches",
    title: "8. Data Breaches",
    content: `In the unlikely event of a data breach, we will notify affected clinics within 72 hours as required by applicable laws. We will conduct a thorough investigation, take immediate remedial actions, and notify relevant regulatory authorities if required. We will provide clear information about what data was affected, what we are doing about it, and what steps you can take to protect yourself. We maintain an incident response plan and conduct regular security training for our team.`,
  },
  {
    id: "children-privacy",
    title: "9. Children's Privacy",
    content: `Nexora Clinic System is not intended for use by children under 16 years of age. We do not knowingly collect personal information from children. If we discover that we have inadvertently collected data from a child, we will delete it immediately upon notification. Clinic administrators are responsible for ensuring proper parental consent when managing patient records for minors.`,
  },
  {
    id: "policy-updates",
    title: "10. Policy Updates",
    content: `We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify active clinics of material changes via email or in-app notifications. The "Last updated" date at the top of this page indicates when the policy was last revised. We encourage you to review this page periodically to stay informed about how we protect your data.`,
  },
  {
    id: "contact-information",
    title: "11. Contact Information",
    content: `For privacy-related inquiries, data access requests, deletion requests, or any questions about this policy, please contact our support team at support@nexora.app. We will respond to legitimate requests within 30 days as required by applicable data protection regulations. For security concerns, please email security@nexora.app directly.`,
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

export default function PrivacyPage() {
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
      // تم تعديل السطر التالي لإصلاح خطأ الـ String Literal
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
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h1
              className="text-[40px] md:text-[44px] font-bold leading-[1.1] mb-3"
              style={{ color: "#0F172A" }}
            >
              Privacy Policy
            </h1>
            <p
              className="text-[16px] leading-[1.6] max-w-[600px] mx-auto mb-2"
              style={{ color: "#64748B" }}
            >
              Learn how Nexora Clinic System collects, uses, and protects your information.
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