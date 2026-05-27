// src/app/book/confirmation/[appointmentId]/page.tsx

import { getBookingConfirmation } from "@/lib/actions/booking"
import { format } from "date-fns"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, Clock, User, Building2 } from "lucide-react"

export default async function ConfirmationPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params  // ← لازم نعمل await

  const data = await getBookingConfirmation(appointmentId)

  if (!data) notFound()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-teal-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
          <p className="text-teal-100 text-sm mt-1">We look forward to seeing you</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-500">Patient</p>
                <p className="font-medium">{data.patient.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-500">Doctor</p>
                <p className="font-medium">Dr. {data.doctor.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium">{format(new Date(data.dateTime), "EEEE, MMM d, yyyy")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-medium">{format(new Date(data.dateTime), "h:mm a")}</p>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400">
            Booking ID: {data.id.substring(0, 8).toUpperCase()}
          </div>
        </div>

        <div className="border-t p-4 bg-gray-50 text-center">
          <Link href="/book" className="text-sm text-teal-600 hover:underline">
            Book Another Appointment
          </Link>
        </div>
      </div>
    </div>
  )
}