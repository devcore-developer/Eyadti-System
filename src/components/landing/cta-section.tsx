// src/components/landing/cta-section.tsx

import Link from "next/link"
import { ArrowRight, MessageSquare } from "lucide-react"

export default function CtaSection() {
  return (
    <section className="px-5 md:px-8 pb-20 md:pb-24">
      <div className="max-w-[960px] mx-auto rounded-[22px] border border-border bg-card py-14 md:py-16 px-8 md:px-16 text-center">
        <h2 className="text-[30px] md:text-[36px] font-bold leading-[1.15] mb-4 text-foreground">
          Start Managing Your Clinic Professionally Today
        </h2>
        <p className="text-[15px] md:text-[16px] leading-[1.6] max-w-[640px] mx-auto mb-9 text-muted-foreground">
          Join hundreds of clinics already using Nexora to save time, reduce no-shows,
          and increase revenue.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-[50px] px-8 rounded-full text-[15px] font-semibold text-primary-foreground bg-gradient-to-r from-primary to-accent shadow-[0_4px_20px_rgba(91,192,190,0.3)] transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-lg"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="https://wa.me/201275976195?text=I'm interested in Nexora Pro"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-[50px] px-8 rounded-full text-[15px] font-semibold border border-border text-foreground transition-all duration-200 ease-out hover:bg-muted/50"
          >
            <MessageSquare className="w-4 h-4" />
            Contact Sales
          </a>
        </div>
      </div>
    </section>
  )
}