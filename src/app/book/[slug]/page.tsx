import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { BookingWizard } from "@/components/booking/booking-wizard"

export const dynamic = 'force-dynamic'

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // بنبحث عن العيادة بالكود بتاعها مش بالـ ID
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    include: { 
      settings: true, // لازم نجيب الـ Settings عشان ناخد اللوجو واسم العيادة
    }
  })

  if (!clinic) notFound()

  // بنهيئ البيانات بالشكل اللي الـ BookingWizard محتاجه
  const clinicData = {
    id: clinic.id,
    name: clinic.settings?.clinicName || clinic.name,
    logoUrl: clinic.settings?.logoUrl || null,
    address: clinic.settings?.address || clinic.address || null,
    phone: clinic.settings?.phone || clinic.phone || null,
    email: clinic.settings?.email || null,
    duration: clinic.settings?.defaultAppointmentDuration || 30,
  }

  return <BookingWizard clinic={clinicData} clinicId={clinic.id} />
}