import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { getPublicClinicInfo } from "@/lib/actions/booking"
import { BookingWizard } from "@/components/booking/booking-wizard"
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

  const clinicInfo = await getPublicClinicInfo(clinic.id)
  if (!clinicInfo) notFound()

  return <BookingWizard clinic={clinicInfo} clinicId={clinic.id} />
}