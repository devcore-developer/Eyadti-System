// src/components/landing/cta-section.tsx

import Link from "next/link"
import { ArrowRight, MessageSquare } from "lucide-react"

export default function CtaSection() {
  return (
    <section className="px-5 md:px-8 pb-20 md:pb-24">
      <div
        className="max-w-[960px] mx-auto rounded-[22px] border py-14 md:py-16 px-8 md:px-16 text-center"
        style={{
          backgroundColor: "#FAFCFF",
          borderColor: "#E6EDF5",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.03)",
        }}
      >
        <h2
          className="text-[30px] md:text-[36px] font-bold leading-[1.15] mb-4"
          style={{ color: "#111827" }}
        >
          Start Managing Your Clinic Professionally Today
        </h2>
        <p
          className="text-[15px] md:text-[16px] leading-[1.6] max-w-[640px] mx-auto mb-9"
          style={{ color: "#64748B" }}
        >
          Join hundreds of clinics already using Nexora to save time, reduce no-shows,
          and increase revenue.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-[50px] px-8 rounded-full text-[15px] font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-px"
            style={{
              background: "linear-gradient(135deg, #43C6C8, #5B8DEF)",
              boxShadow: "0 4px 20px rgba(91,141,239,0.3)",
            }}
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="https://wa.me/201275976195?text=I'm interested in Nexora Pro"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-[50px] px-8 rounded-full text-[15px] font-semibold transition-all duration-200 ease-out hover:bg-slate-50"
            style={{
              border: "1px solid #D9E2EC",
              color: "#111827",
            }}
          >
            <MessageSquare className="w-4 h-4" />
            Contact Sales
          </a>
        </div>
      </div>
    </section>
  )
}