import { notFound } from "next/navigation"
import { getBookingConfirmation } from "@/lib/actions/booking"
import { Calendar, Clock, MapPin, User, Phone, Share2 } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function ConfirmationPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params
  
  const data = await getBookingConfirmation(appointmentId)
  
  if (!data) notFound()

  const { patient, doctor, clinic, dateTime, clinicName, logoUrl } = data

  const dateObj = new Date(dateTime)
  const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-teal-100 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Success Header */}
        <div className="bg-teal-600 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-2xl font-bold mb-1">You're Booked!</h1>
            <p className="text-teal-100 text-sm">Appointment #{appointmentId.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        {/* Details Card */}
        <div className="p-6 space-y-6">
          
          {/* Clinic Info */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden">
               {logoUrl ? <img src={logoUrl} alt="Logo" /> : <MapPin className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{clinicName}</h2>
              <p className="text-xs text-gray-500">{clinic.address}</p>
            </div>
          </div>

          {/* Time & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Date</span>
              </div>
              <p className="font-bold text-gray-900 leading-tight">{dateStr}</p>
            </div>
            <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
              <div className="flex items-center gap-2 text-teal-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Time</span>
              </div>
              <p className="font-bold text-teal-900 leading-tight">{timeStr}</p>
            </div>
          </div>

          {/* Doctor & Patient */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Doctor</p>
                  <p className="font-semibold text-gray-900">Dr. {doctor.name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="font-semibold text-gray-900">{patient.fullName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-3">
            <a 
              href={`tel:${clinic.phone}`}
              className="w-full py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Phone className="w-4 h-4" /> Call Clinic
            </a>
            
            <div className="text-center">
               <Link href="/" className="text-sm text-gray-400 hover:text-teal-600 transition-colors">
                 Return to Home
               </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}