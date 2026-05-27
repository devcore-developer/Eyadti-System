// src/app/book/[doctorId]/page.tsx

import { getPublicClinicInfo, getAvailableDoctors } from "@/lib/actions/booking"
import { BookingWizard } from "@/components/booking/booking-wizard"

const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID || "c1"

export default async function BookDoctorPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = await params
  const [clinic, doctors] = await Promise.all([
    getPublicClinicInfo(CLINIC_ID),
    getAvailableDoctors(CLINIC_ID),
  ])

  const doctor = doctors.find((d) => d.id === doctorId)

  if (!doctor) {
    return <div className="p-10 text-center">Doctor not found</div>
  }

  return <BookingWizard clinic={clinic} doctor={doctor} clinicId={CLINIC_ID} />
}