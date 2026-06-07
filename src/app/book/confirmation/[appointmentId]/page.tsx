// src/app/book/confirmation/[appointmentId]/page.tsx
import { getBookingConfirmation } from "@/lib/actions/booking"
import { format } from "date-fns"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, Clock, User, Building2, CheckCircle2 } from "lucide-react"
export const dynamic = 'force-dynamic'

export default async function ConfirmationPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params
  const data = await getBookingConfirmation(appointmentId)

  if (!data) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-teal-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMikiLz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative z-10">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-3 text-teal-100" />
            <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
            <p className="text-teal-100 text-sm mt-1">We look forward to seeing you</p>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg border">
                <User className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Patient</p>
                <p className="font-semibold text-gray-900">{data.patient.fullName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg border">
                <User className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Doctor</p>
                <p className="font-semibold text-gray-900">Dr. {data.doctor.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg border">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-semibold text-gray-900">{format(new Date(data.dateTime), "EEEE, MMM d, yyyy")}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg border">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-semibold text-gray-900">{format(new Date(data.dateTime), "h:mm a")}</p>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 bg-gray-50 rounded-lg p-2 font-mono">
            Booking ID: {data.id.substring(0, 8).toUpperCase()}
          </div>
        </div>

        <div className="border-t p-4 bg-gray-50 text-center">
          <Link href="/book" className="text-sm text-teal-600 hover:underline font-medium">
            ← Book Another Appointment
          </Link>
        </div>
      </div>
    </div>
  )
}