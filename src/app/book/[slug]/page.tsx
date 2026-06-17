import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { getPublicClinicInfo } from "@/lib/actions/booking"
import { BookingWizard } from "@/components/booking/booking-wizard"

export const dynamic = 'force-dynamic'

export default async function BookClinicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (!slug) notFound()

  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: { id: true, name: true, logoUrl: true }
  })

  if (!clinic) notFound()

  const clinicInfo = await getPublicClinicInfo(clinic.id)
  
  if (!clinicInfo) notFound()

  return <BookingWizard clinic={clinicInfo} clinicId={clinic.id} />
}