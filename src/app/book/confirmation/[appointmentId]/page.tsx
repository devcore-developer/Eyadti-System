import { notFound } from "next/navigation"
import { getBookingConfirmation } from "@/lib/actions/booking"
import { Calendar, Clock, MapPin, User, Phone, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ConfirmationPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params
  const data = await getBookingConfirmation(appointmentId)
  if (!data) notFound()

  const { patient, doctor, clinic, dateTime, clinicName, logoUrl } = data
  const dateObj = new Date(dateTime)
  const dateStr = dateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* ─── Success Card ─── */}
        <div className="bg-white rounded-[30px] shadow-[0_20px_60px_rgba(15,23,42,.08)] border border-gray-100/80 overflow-hidden">
          {/* Header */}
          <div className="relative px-8 pt-10 pb-8 text-center overflow-hidden" style={{ background: "linear-gradient(135deg, #15B8A6, #3B82F6)" }}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,white,transparent_70%)]" />
            <div className="relative z-10">
              <div className="w-18 h-18 mx-auto mb-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30" style={{ width: 72, height: 72 }}>
                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">You&apos;re Booked!</h1>
              <p className="text-white/70 text-sm font-medium">Confirmation #{appointmentId.slice(-6).toUpperCase()}</p>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8 space-y-6">
            {/* Clinic */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : <MapPin className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900 truncate">{clinicName}</h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{clinic.address}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Date</span>
                </div>
                <p className="font-bold text-slate-900 text-sm leading-snug">{dateStr}</p>
              </div>
              <div className="p-4 rounded-2xl border border-blue-100" style={{ background: "linear-gradient(135deg, #EFF6FF, #F0FDFA)" }}>
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Time</span>
                </div>
                <p className="font-bold text-blue-900 text-sm">{timeStr}</p>
              </div>
            </div>

            {/* Doctor & Patient */}
            <div className="space-y-2">
              {[
                { icon: User, label: "Doctor", value: `Dr. ${doctor.name}`, color: "blue" },
                { icon: User, label: "Patient", value: patient.fullName, color: "violet" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    item.color === "blue" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{item.label}</p>
                    <p className="font-semibold text-slate-900 text-sm">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-3">
              <a
                href={`tel:${clinic.phone}`}
                className="w-full py-3.5 bg-white border-2 border-gray-200 text-slate-700 rounded-2xl hover:border-slate-300 hover:bg-slate-50 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-sm"
              >
                <Phone className="w-4 h-4" /> Call Clinic
              </a>

              <Link
                href="/"
                className="w-full py-3.5 text-center text-sm font-semibold text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1"
              >
                Return to Home <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Your booking is confirmed and encrypted</span>
        </div>
      </div>
    </div>
  )
}