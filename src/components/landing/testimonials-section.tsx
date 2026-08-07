"use client"

import { useState, useEffect } from "react"
import { Star, Quote } from "lucide-react"
import { MotionWrapper } from "./motion-wrapper"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/i18n-context" // ⬅️ إضافة الـ Hook

interface Testimonial {
  id: string
  name: string
  clinicName: string
  position?: string
  photoUrl?: string
  review: string
  rating: number
  displayOrder: number
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLang() // ⬅️ الترجمة

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const res = await fetch("/api/testimonials")
        if (res.ok) {
          const data = await res.json()
          setTestimonials(data)
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }
    loadTestimonials()
  }, [])

  if (loading) return null
  if (testimonials.length === 0) return null

  return (
    <section id="testimonials" className="py-24 md:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionWrapper className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">
            {t("landing.trustedByClinics")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.trustedByDesc")}
          </p>
        </MotionWrapper>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <MotionWrapper key={t.id} delay={i * 0.1}>
              <div className="premium-card p-6 h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-4 end-4 text-[#F4B860] opacity-20"> {/* ⬅️ right لـ end */}
                  <Quote className="h-16 w-16" />
                </div>
                <div className="relative z-10 flex-1">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className={cn(
                          "h-4 w-4",
                          si < t.rating
                            ? "fill-[#F4B860] text-[#F4B860]"
                            : "fill-muted text-muted"
                        )}
                      />
                    ))}
                  </div>

                  {/* Review */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                    &ldquo;{t.review}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <Avatar className="h-10 w-10">
                      {t.photoUrl ? (
                        <img src={t.photoUrl} alt={t.name} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF] text-white text-xs font-bold">
                          {t.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.position ? `${t.position}, ` : ""}{t.clinicName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </MotionWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}