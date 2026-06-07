// src/app/book/page.tsx
export const dynamic = 'force-dynamic'

import { getPublicClinicInfo } from "@/lib/actions/booking"
import { BookingWizard } from "@/components/booking/booking-wizard"

const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID || "c1"

export default async function BookPage() {
  const clinic = await getPublicClinicInfo(CLINIC_ID)

  return <BookingWizard clinic={clinic} clinicId={CLINIC_ID} />
}