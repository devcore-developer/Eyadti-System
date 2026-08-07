// src/components/landing/testimonials-section.tsx

import { prisma } from "@/lib/db"
import { Quote } from "lucide-react"

import { Star } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1.5" dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={18}
          strokeWidth={1.8}
          fill={i < rating ? "#F5B74F" : "transparent"}
          className={i < rating ? "text-[#F5B74F]" : "text-[#CBD5E1]"}
        />
      ))}
    </div>
  );
}

function InitialsAvatar({ name }: { name: string }) {
  const words = name.trim().split(/\s+/)
  let initials = ""
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase()
  } else if (words.length === 1 && words[0].length >= 2) {
    initials = words[0].slice(0, 2).toUpperCase()
  } else {
    initials = words[0]?.[0]?.toUpperCase() || "?"
  }

  return (
    <div
      className="flex items-center justify-center w-11 h-11 rounded-full text-sm font-bold text-white flex-shrink-0"
      style={{ backgroundColor: "#3B82F6" }}
    >
      {initials}
    </div>
  )
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: {
    id: string
    name: string
    clinicName: string
    position: string | null
    photoUrl: string | null
    review: string
    rating: number
  }
}) {
  const isArabic = /[\u0600-\u06FF]/.test(testimonial.review)

  return (
    <div
      className="relative bg-white rounded-[20px] border border-slate-200 p-7 md:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
    >
      {/* Decorative Quote Icon */}
      <Quote
        className="absolute top-6 right-6 w-12 h-12 text-blue-500 opacity-[0.12] pointer-events-none"
        strokeWidth={1.5}
      />

      {/* Rating */}
      <div className="mb-5">
        <StarRating rating={testimonial.rating} />
      </div>

      {/* Review Text */}
      <p
        className="text-[16px] leading-[1.7] mb-7 min-h-[100px]"
        style={{ color: "#334155", direction: isArabic ? "rtl" : "ltr", textAlign: isArabic ? "right" : "left" }}
      >
        &ldquo;{testimonial.review}&rdquo;
      </p>

      {/* Author */}
      <div className={`flex items-center gap-3 pt-5 border-t border-slate-100 ${isArabic ? "flex-row-reverse" : ""}`}>
        {testimonial.photoUrl ? (
          <img
            src={testimonial.photoUrl}
            alt={testimonial.name}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <InitialsAvatar name={testimonial.name} />
        )}
        <div className={`min-w-0 ${isArabic ? "text-right" : ""}`}>
          <p className="text-[14px] font-bold leading-tight truncate" style={{ color: "#0F172A" }}>
            {testimonial.name}
          </p>
          <p className="text-[12px] mt-0.5 truncate" style={{ color: "#64748B" }}>
            {testimonial.clinicName}
            {testimonial.position ? ` · ${testimonial.position}` : ""}
          </p>
        </div>
      </div>
    </div>
  )
}

export default async function TestimonialsSection() {
  const testimonials = await prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: "asc" },
  })

  // Don't render the section at all if there are no published testimonials
  if (testimonials.length === 0) {
    return null
  }

  const isSingle = testimonials.length === 1
  const isTwo = testimonials.length === 2

  return (
    <section className="py-20 md:py-24">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        {/* ── Header ──────────────────────────────────── */}
        <div className="text-center mb-12 md:mb-16">
          <h2
            className="text-[40px] md:text-[46px] font-extrabold leading-[1.15] mb-4"
            style={{ color: "#0F172A" }}
          >
            Trusted by Clinics & Medical Centers
          </h2>
          <p
            className="text-[16px] md:text-[17px] leading-relaxed max-w-[680px] mx-auto"
            style={{ color: "#64748B" }}
          >
            Our platform is trusted by clinics and medical centers across the region,
            providing seamless management and patient care.
          </p>
        </div>

        {/* ── Testimonials Grid ────────────────────────── */}
        <div
          className={`
            ${isSingle ? "max-w-[500px] mx-auto" : ""}
            ${isTwo ? "max-w-[700px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6" : ""}
            ${
              !isSingle && !isTwo
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : ""
            }
          `}
        >
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  )
}