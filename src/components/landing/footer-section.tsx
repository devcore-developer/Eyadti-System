// src/components/landing/footer-section.tsx

import Link from "next/link"
import { Mail, MessageSquare } from "lucide-react"

function NexoraLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: "linear-gradient(135deg, #5BC0BE, #6B9CFF)",
        boxShadow: "0 2px 8px rgba(91, 192, 255, 0.3)",
      }}
    >
      <span
        style={{
          color: "#FFFFFF",
          fontSize: `${size * 0.4}px`,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        N
      </span>
    </div>
  )
}

export default function FooterSection() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="border-t"
      style={{ backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" }}
    >
      <div
        className="mx-auto px-6 md:px-12 py-14 md:py-16"
        style={{ maxWidth: "1200px", width: "calc(100% - 48px)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.8fr_0.8fr] gap-10 md:gap-16">
          {/* ── Brand Column ─────────────────────────── */}
          <div>
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
              <NexoraLogo size={40} />
              <span
                className="text-[20px] font-extrabold tracking-tight transition-colors duration-150 group-hover:text-blue-600"
                style={{ color: "#0F172A" }}
              >
                Nexora
              </span>
            </Link>

            <p
              className="text-[14px] leading-[1.7] mb-7 max-w-[300px]"
              style={{ color: "#64748B" }}
            >
              Professional clinic management system.
              <br />
              Streamline appointments, billing, and patient records.
            </p>

            {/* Contact */}
            <div className="space-y-3">
              <a
                href="mailto:support@nexora.app"
                className="inline-flex items-center gap-2.5 text-[13px] transition-colors duration-150 hover:text-blue-600"
                style={{ color: "#64748B" }}
              >
                <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#94A3B8" }} />
                support@nexora.app
              </a>
              <a
                href="https://wa.me/201275976195?text=I need support with Nexora"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[13px] transition-colors duration-150 hover:text-green-600"
                style={{ color: "#64748B" }}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#94A3B8" }} />
                WhatsApp Support
              </a>
            </div>
          </div>

          {/* ── Product Column ───────────────────────── */}
          <div>
            <h4
              className="text-[11px] font-semibold uppercase mb-5"
              style={{ color: "#475569", letterSpacing: "0.12em" }}
            >
              Product
            </h4>
            <ul className="space-y-3.5">
              {[
                { label: "Features", href: "/#features" },
                { label: "Pricing", href: "/#pricing" },
                { label: "FAQ", href: "/#faq" },
                { label: "Testimonials", href: "/#testimonials" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[14px] transition-colors duration-150 hover:text-blue-600"
                    style={{ color: "#64748B" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Legal Column ────────────────────────── */}
          <div>
            <h4
              className="text-[11px] font-semibold uppercase mb-5"
              style={{ color: "#475569", letterSpacing: "0.12em" }}
            >
              Legal
            </h4>
            <ul className="space-y-3.5">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms & Conditions", href: "/terms" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[14px] transition-colors duration-150 hover:text-blue-600"
                    style={{ color: "#64748B" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom Bar ─────────────────────────────── */}
        <div
          className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0"
          style={{ borderColor: "#E2E8F0" }}
        >
          <p className="text-[12px]" style={{ color: "#94A3B8" }}>
            © {currentYear} Nexora. All rights reserved.
          </p>
          <p className="text-[12px]" style={{ color: "#94A3B8" }}>
            Designed for healthcare professionals
          </p>
        </div>
      </div>
    </footer>
  )
}