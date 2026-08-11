// src/app/book/[slug]/page.tsx - استبدل بالكامل

import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { getPublicClinicInfo } from "@/lib/actions/booking"
import { BookingWizard } from "@/components/booking/booking-wizard"
import { BookingLangProvider } from "@/components/booking/booking-localization"
import { CalendarX2, Lock } from "lucide-react"
import type { Metadata } from "next"
import { Cairo } from "next/font/google"
import { hasFeature } from "@/lib/services/feature-gate"  // ← إضافة الاستيراد
import Link from "next/link"  // ← إضافة الاستيراد

// تحميل خط Cairo العربي
const cairo = Cairo({ 
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap"
})

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: { name: true, address: true },
  })
  if (!clinic) return { title: "Clinic Not Found" }
  return {
    title: `احجز موعدك — ${clinic.name}`,
    description: `احجز موعدك في ${clinic.name}`,
  }
}

export default async function BookClinicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slug) notFound()

  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: { id: true, name: true, logoUrl: true, phone: true, address: true },
  })

  if (!clinic) notFound()

  // ═══════════════════════════════════════════════════════════
  // ✅ FIX: فحص الـ Plan أولاً (المصدر الوحيد للحقيقة)
  // ═══════════════════════════════════════════════════════════
  const hasOnlineBooking = await hasFeature(clinic.id, "ONLINE_BOOKING")
  
  if (!hasOnlineBooking) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 font-sans">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">الحجز الإلكتروني غير متاح</h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            هذه الخدمة غير متاحة في خطة العيادة الحالية. 
            يرجى التواصل مع العيادة مباشرة لحجز موعد أو ترقية الخطة.
          </p>
          {clinic.phone && <p className="text-sm font-medium text-slate-700">هاتف: {clinic.phone}</p>}
        </div>
      </div>
    )
  }

  // ✅ فحص الـ Setting كطبقة إضافية (يمكن للعيادة تعطيلها مؤقتاً)
  const settings = await prisma.clinicSettings.findUnique({
    where: { clinicId: clinic.id },
    select: { enableOnlineBooking: true },
  })

  if (!settings?.enableOnlineBooking) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 font-sans">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-lg">
            <CalendarX2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">الحجز الإلكتروني معطل مؤقتاً</h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {clinic.name} قامت بتعطيل الحجز الإلكتروني مؤقتاً. يرجى التواصل مع العيادة مباشرة لحجز موعد.
          </p>
          {clinic.phone && <p className="text-sm font-medium text-slate-700">هاتف: {clinic.phone}</p>}
        </div>
      </div>
    )
  }

  const clinicInfo = await getPublicClinicInfo(clinic.id)
  if (!clinicInfo) notFound()

  return (
    <div className={`${cairo.variable} font-sans`}>
      <BookingLangProvider>
        <BookingWizard clinic={clinicInfo} clinicId={clinic.id} slug={slug} />
      </BookingLangProvider>
    </div>
  )
}