// src/components/landing/faq-section.tsx

"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface FaqItem {
  question: string
  answer: string
}

const faqData: FaqItem[] = [
  {
    question: "What is Nexora Pro?",
    answer:
      "Nexora Pro is a comprehensive clinic management platform designed for healthcare providers. It handles patient records, appointments, invoicing, online booking, doctor scheduling, WhatsApp notifications, and more — all from a single dashboard.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "Start with a 7-day free trial with full access to the Standard plan features. No credit card required. When the trial ends, you can activate a subscription code to continue using the platform without losing any data.",
  },
  {
    question: "Can I manage multiple clinic branches?",
    answer:
      "Yes. The Professional plan supports up to 3 branches, and Enterprise supports custom multi-branch configurations. Each branch can have its own doctors, schedules, and patient records, all managed from one central dashboard.",
  },
  {
    question: "Does Nexora Pro support online booking?",
    answer:
      "Yes. Patients can book appointments directly through your clinic's online booking page. You control which doctors, branches, and time slots are available. Booking confirmations and reminders are sent automatically.",
  },
  {
    question: "Is my patients' data secure?",
    answer:
      "Absolutely. All data is encrypted at rest and in transit. We follow healthcare data protection best practices. Your clinic's data is isolated from other clinics, and you maintain full ownership of your patient records at all times.",
  },
  {
    question: "Does it integrate with WhatsApp?",
    answer:
      "Yes. Professional and Enterprise plans include WhatsApp integration for sending appointment reminders, confirmations, and notifications directly to your patients' WhatsApp numbers.",
  },
  {
    question: "Can I track invoices and payments?",
    answer:
      "Yes. Nexora Pro includes a full invoicing system where you can create invoices, track payments, record partial payments, and monitor outstanding balances. Detailed payment history and reports are available in your dashboard.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes. You are not locked into any long-term contract. You can cancel or change your plan at any time from your billing settings. Your data remains accessible even after cancellation.",
  },
]

function FaqAccordionItem({
  item,
  isOpen,
  onToggle,
  index,
}: {
  item: FaqItem
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
        isOpen ? "bg-muted/50 border-primary/30" : "bg-card border-border"
      }`}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
        className="flex items-center justify-between w-full px-6 py-5 text-left cursor-pointer"
        style={{ minHeight: "52px" }}
      >
        <span className="text-[15px] font-semibold pr-4 leading-[1.5] text-foreground">
          {item.question}
        </span>
        <ChevronDown
          className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 ease-out text-muted-foreground ${
            isOpen ? "rotate-180deg" : ""
          }`}
        />
      </button>

      <div
        id={`faq-answer-${index}`}
        role="region"
        aria-labelledby={`faq-question-${index}`}
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: isOpen ? "500px" : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-6 pb-6 pt-3">
          <p className="text-[15px] leading-[1.7] max-w-[760px] text-muted-foreground">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="pt-[100px] pb-[90px]">
      <div className="max-w-[920px] mx-auto px-5 md:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-14">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <div className="w-8 h-[2px] rounded-full bg-primary/30" />
            <div className="w-2 h-2 rounded-full bg-primary/50" />
            <div className="w-8 h-[2px] rounded-full bg-primary/30" />
          </div>

          <h2 className="text-[42px] md:text-[46px] font-extrabold leading-[1.1] mb-4 text-foreground" style={{ letterSpacing: "-0.02em" }}>
            Frequently Asked Questions
          </h2>
          <p className="text-[16px] leading-[1.6] text-muted-foreground">
            Everything you need to know about Nexora Pro
          </p>
        </div>

        {/* FAQ List */}
        <div className="flex flex-col gap-[10px]">
          {faqData.map((item, index) => (
            <FaqAccordionItem
              key={index}
              item={item}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}