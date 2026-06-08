import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { BookingWizard } from "@/components/booking/booking-wizard"

// هنا بنستقبل الكود من الرابط
export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // بنبحث عن العيادة بالكود بتاعها مش بالـ ID
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    include: { 
      settings: true,
      branches: { where: { isActive: true } }
    }
  })

  if (!clinic) notFound()

  return <BookingWizard clinic={clinic} clinicId={clinic.id} />
}