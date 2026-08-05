import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { getPublicClinicInfo } from "@/lib/actions/booking"
import { BookingWizard } from "@/components/booking/booking-wizard"
import { CalendarX2 } from "lucide-react"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: { name: true, address: true },
  })
  if (!clinic) return { title: "Clinic Not Found" }
  return {
    title: `Book Appointment — ${clinic.name}`,
    description: `Schedule your visit to ${clinic.name}${clinic.address ? ` located at ${clinic.address}` : ""}. Professional healthcare booking.`,
    openGraph: { title: `Book at ${clinic.name}`, description: "Book your appointment online.", type: "website" },
  }
}

export default async function BookClinicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slug) notFound()

  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      phone: true,
      address: true,
    },
  })

  if (!clinic) notFound()

  // ⭐ شيك هل الـ online booking مفعّل
  const settings = await prisma.clinicSettings.findUnique({
    where: { clinicId: clinic.id },
    select: { enableOnlineBooking: true },
  })

  if (!settings?.enableOnlineBooking) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-lg">
            <CalendarX2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Online Booking Unavailable</h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {clinic.name} has temporarily disabled online booking. Please contact the clinic directly to schedule your appointment.
          </p>
          {clinic.phone && (
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Phone: {clinic.phone}
            </p>
          )}
        </div>
      </div>
    )
  }

  const clinicInfo = await getPublicClinicInfo(clinic.id)
  if (!clinicInfo) notFound()

  return <BookingWizard clinic={clinicInfo} clinicId={clinic.id} />
}