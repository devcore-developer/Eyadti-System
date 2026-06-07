// src/app/book/[doctorId]/page.tsx
import { getPublicClinicInfo, getAvailableDoctors } from "@/lib/actions/booking"
import { BookingWizard } from "@/components/booking/booking-wizard"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'
const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID || "c1"

export default async function BookDoctorPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = await params
  const [clinic, doctors] = await Promise.all([
    getPublicClinicInfo(CLINIC_ID),
    getAvailableDoctors(CLINIC_ID),
  ])

  const doctor = doctors.find((d) => d.id === doctorId)

  // لو الدكتور مش موجود أو مش شغال الحجز الأونلاين
  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Doctor Not Available</h2>
          <p className="text-gray-500 mb-6">This doctor is not available for online booking at the moment.</p>
          <a href="/book" className="text-teal-600 hover:underline font-medium">
            ← Book with another doctor
          </a>
        </div>
      </div>
    )
  }

  // هنا ممكن تضيف props للـ Wizard عشان يتخطى خطوة اختيار الدكتور، 
  // لكن عشان متعقدش الكود دلوقتي، هيفضل يفتح الـ Wizard عادي والمريض يكمل
  return <BookingWizard clinic={clinic} clinicId={CLINIC_ID} />
}