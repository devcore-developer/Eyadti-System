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
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto px-6 md:px-12 py-14 md:py-16" style={{ maxWidth: "1200px", width: "calc(100% - 48px)" }}>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.8fr_0.8fr] gap-10 md:gap-16">
          {/* Brand Column */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
              <NexoraLogo size={40} />
              <span className="text-[20px] font-extrabold tracking-tight text-foreground transition-colors duration-150 group-hover:text-primary">
                Nexora
              </span>
            </Link>

            <p className="text-[14px] leading-[1.7] mb-7 max-w-[300px] text-muted-foreground">
              Professional clinic management system.
              <br />
              Streamline appointments, billing, and patient records.
            </p>

            <div className="space-y-3">
              <a
                href="mailto:support@nexora.app"
                className="inline-flex items-center gap-2.5 text-[13px] text-muted-foreground transition-colors duration-150 hover:text-primary"
              >
                <Mail className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/60" />
                support@nexora.app
              </a>
              <a
                href="https://wa.me/201275976195?text=I need support with Nexora"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[13px] text-muted-foreground transition-colors duration-150 hover:text-success"
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/60" />
                WhatsApp Support
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase mb-5 text-foreground/70" style={{ letterSpacing: "0.12em" }}>
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
                    className="text-[14px] text-muted-foreground transition-colors duration-150 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase mb-5 text-foreground/70" style={{ letterSpacing: "0.12em" }}>
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
                    className="text-[14px] text-muted-foreground transition-colors duration-150 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <p className="text-[12px] text-muted-foreground/70">
            © {currentYear} Nexora. All rights reserved.
          </p>
          <p className="text-[12px] text-muted-foreground/70">
            Designed for healthcare professionals
          </p>
        </div>
      </div>
    </footer>
  )
}