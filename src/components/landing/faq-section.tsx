"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "What is Nexora?",
    answer: "Nexora is a comprehensive clinic management system designed for healthcare providers in the Middle East. It handles patient records, appointments, billing, prescriptions, online booking, WhatsApp notifications, and advanced analytics — all from one dashboard."
  },
  {
    question: "How does the free trial work?",
    answer: "When you sign up with an activation code, your clinic gets a 5-day trial period with full access to all features included in your selected plan. No credit card is required to start."
  },
  {
    question: "How long is the trial period?",
    answer: "The trial period is 5 days by default. During this time, you can explore all features, add patients, create appointments, and test the system thoroughly before committing to a paid plan."
  },
  {
    question: "Can I upgrade my plan later?",
    answer: "Absolutely. You can upgrade or downgrade your plan at any time from the Billing settings in your dashboard. If you upgrade mid-cycle, the price difference will be prorated automatically."
  },
  {
    question: "How do subscriptions work?",
    answer: "Nexora uses monthly or yearly billing cycles. You choose a plan that fits your clinic size, and your subscription renews automatically. You can cancel anytime — your data remains accessible until the end of your billing period."
  },
  {
    question: "Can I manage multiple branches?",
    answer: "Yes! The Professional and Enterprise plans support multiple branches. You can manage doctors, schedules, and patient queues for each branch from a single dashboard. Branch switching is instant."
  },
  {
    question: "Does Nexora support online booking?",
    answer: "Yes. Each clinic gets a unique booking link that you can share with patients via WhatsApp, SMS, or your website. Patients can book appointments 24/7 without calling the clinic."
  },
  {
    question: "Is patient data secure?",
    answer: "Security is a top priority. All data is encrypted in transit and at rest. We use PostgreSQL with SSL, and all file uploads are stored on Cloudinary's secure infrastructure. We comply with data protection best practices."
  },
  {
    question: "Does Nexora support WhatsApp?",
    answer: "Yes. Nexora integrates with UltraMsg to send automated appointment reminders, follow-up messages, and notifications directly to patients via WhatsApp. This reduces no-shows significantly."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time from the Billing settings. Your account will remain active until the end of the current billing period. No penalties or hidden fees."
  },
  {
    question: "How do I contact support?",
    answer: "You can reach us via WhatsApp at the number listed in your dashboard, or email us at support@nexora.app. We typically respond within a few hours during business days."
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-3">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-muted-foreground">
          Everything you need to know about Nexora
        </p>
      </div>

      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={{ backgroundColor: openIndex === index ? "hsl(var(--muted))" : "transparent" }}
            className="rounded-xl border border-border/50 overflow-hidden"
          >
            <button
              onClick={() => toggle(index)}
              className="flex items-center justify-between w-full p-5 text-left"
            >
              <span className="text-sm font-semibold pr-4">{faq.question}</span>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </motion.div>
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  )
}