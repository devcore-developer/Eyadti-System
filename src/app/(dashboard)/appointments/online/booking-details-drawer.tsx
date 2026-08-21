"use client"

import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  X, Phone, MessageCircle, Check, XCircle,
  User, Calendar, Clock, Building2, FileText,
  LogIn, Loader2, Stethoscope, Save, ArrowRight, Info
} from "lucide-react"
import { confirmBooking, cancelBooking, updateBookingNotes } from "@/lib/actions/booking"

// ✅ استدعاء الـ Actions الموجودة في نظام الـ Walk-in (بدون تعديلها)
import { completePreVisitCheckIn } from "@/lib/actions/visits"
import { finalizeWaitingRoomEntry } from "@/lib/actions/payment-workflow"
import { PreVisitPaymentDialog } from "@/components/appointments/pre-visit-payment-dialog"

import { toast } from "sonner"

type Booking = {
  id: string
  status: string
  createdAt: Date
  branchId: string | null
  patient: { fullName: string; phone: string; gender: string; dateOfBirth: Date; id: string }
  doctor: { name: string; image?: string | null; specialty?: string | null }
  appointment: {
    dateTime: Date | null
    status: string
    id: string
    notes: string | null
    visit: { id: string; status: string; checkedInAt: Date | null } | null
  } | null
  branch: { name: string } | null
}

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  PENDING:    { label: "Pending",     bg: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200",    dot: "bg-amber-500" },
  CONFIRMED:  { label: "Confirmed",   bg: "bg-blue-50",     text: "text-blue-700",     border: "border-blue-200",     dot: "bg-blue-500" },
  CHECKED_IN: { label: "Checked In",  bg: "bg-cyan-50",     text: "text-cyan-700",     border: "border-cyan-200",     dot: "bg-cyan-500" },
  COMPLETED:  { label: "Completed",   bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200",  dot: "bg-emerald-500" },
  CANCELLED:  { label: "Cancelled",   bg: "bg-red-50",      text: "text-red-700",      border: "border-red-200",      dot: "bg-red-500" },
  NO_SHOW:    { label: "No Show",     bg: "bg-red-50",      text: "text-red-700",      border: "border-red-200",      dot: "bg-red-500" },
}

function calcAge(dob: Date): number {
  const today = new Date()
  const b = new Date(dob)
  let age = today.getFullYear() - b.getFullYear()
  const m = today.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--
  return age
}
function fmtDate(d: Date) { return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) }
function fmtTime(d: Date) { return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) }
function fmtDateTime(d: Date) { return fmtDate(d) + " · " + fmtTime(d) }

// ✅ إضافة الـ Props الجديدة
export function BookingDetailsDrawer({ 
  booking, 
  clinicId, 
  onClose, 
  onUpdated, 
  onStatusUpdated 
}: { 
  booking: Booking; 
  clinicId: string;
  onClose: () => void; 
  onUpdated: () => void;
  onStatusUpdated?: (bookingId: string, newStatus: string) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStatus, setCurrentStatus] = useState(booking.status)
  const [notes, setNotes] = useState(booking.appointment?.notes || "")
  const [notesSaved, setNotesSaved] = useState(true)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  // ✅ حالة الـ Payment Dialog (مطابقة لـ PatientVisitForm)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [pendingCheckIn, setPendingCheckIn] = useState<{
    appointmentId: string
    patientId: string
    patientName: string
    policy: string
  } | null>(null)

  const displayStatus = currentStatus === "COMPLETED" && booking.appointment?.visit ? "CHECKED_IN" : currentStatus
  const sc = statusConfig[displayStatus] || statusConfig.PENDING
  const isTerminal = ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(currentStatus)
  const phone = booking.patient.phone.replace(/\D/g, "")
  const whatsappMsg = encodeURIComponent(`Hello ${booking.patient.fullName}, regarding your appointment at ${booking.branch?.name || "our clinic"} with Dr. ${booking.doctor.name}${booking.appointment?.dateTime ? ` on ${fmtDate(booking.appointment.dateTime)} at ${fmtTime(booking.appointment.dateTime)}` : ""}.`)

  function handleAction(action: () => Promise<any>, feedback: string, targetStatus?: string) {
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        // ✅ تحديث فوري للـ UI للأب (إصلاح مشكلة الـ Refresh)
        if (targetStatus && onStatusUpdated) {
          onStatusUpdated(booking.id, targetStatus)
        }
        setActionFeedback(feedback)
        setTimeout(() => { 
          setActionFeedback(null); 
          onUpdated(); 
          onClose() 
        }, 1200)
      }
    })
  }

  // ═══════════════════════════════════════════════════════════
  // ✅ منطق الـ Check-in الجديد (مرتبط بالـ Payment Workflow)
  // ═══════════════════════════════════════════════════════════
  function handleCheckIn() {
    if (!booking.appointment?.id) {
      return toast.error("No appointment linked to this booking.")
    }

    // ✅ FIX: استخراج المتغيرات هنا لكي يتعرف عليهم TypeScript داخل الـ startTransition
    const appointmentId = booking.appointment.id

    startTransition(async () => {
      const result = await completePreVisitCheckIn({
        appointmentId: appointmentId, // ✅ تم الإصلاح
        isEmergency: false,
      })

      if (result.success) {
        toast.success("Patient checked in — moved to Waiting Room")
        onStatusUpdated?.(booking.id, "COMPLETED")
        setTimeout(() => { onUpdated(); onClose() }, 1000)
      } 
      else if (result.error === "PAYMENT_REQUIRED" || result.error === "SPLIT_PRE_VISIT_PAYMENT_REQUIRED") {
        setPendingCheckIn({
          appointmentId: appointmentId,
          patientId: booking.patient.id,
          patientName: booking.patient.fullName,
          policy: result.error === "SPLIT_PRE_VISIT_PAYMENT_REQUIRED" ? "SPLIT_PAYMENT" : "PAY_BEFORE_VISIT",
        })
        setShowPaymentDialog(true)
      } 
      else if (result.error === "Visit already exists for this appointment") {
        toast.info("Patient is already checked in.")
        onStatusUpdated?.(booking.id, "COMPLETED")
        onUpdated(); onClose();
      }
      else {
        toast.error(result.error || "Check-in failed")
      }
    })
  }

  // ✅ ما يحدث بعد إغلاق نافذة الدفع بنجاح
  function handlePaymentComplete(success: boolean) {
    setShowPaymentDialog(false)
    if (success && pendingCheckIn) {
      // ✅ FIX: استخراج المتغيرات هنا أيضاً
      const targetAppointmentId = pendingCheckIn.appointmentId
      const isSplit = pendingCheckIn.policy === "SPLIT_PAYMENT"

      startTransition(async () => {
        if (isSplit) {
          const res = await finalizeWaitingRoomEntry({
            appointmentId: targetAppointmentId, // ✅ تم الإصلاح
          })
          if (res.success) {
            toast.success("Payment recorded & patient added to queue")
            onStatusUpdated?.(booking.id, "COMPLETED")
            setTimeout(() => { onUpdated(); onClose() }, 1000)
          } else {
            toast.error(res.error || "Added to queue failed")
          }
        } else {
          const res = await completePreVisitCheckIn({
            appointmentId: targetAppointmentId, // ✅ تم الإصلاح
            isEmergency: false,
          })
          if (res.success) {
            toast.success("Payment recorded & patient checked in")
            onStatusUpdated?.(booking.id, "COMPLETED")
            setTimeout(() => { onUpdated(); onClose() }, 1000)
          } else {
            toast.error(res.error || "Check-in failed after payment")
          }
        }
      })
    }
    setPendingCheckIn(null)
  }

  function handleSaveNotes() {
    if (!booking.appointment?.id) return
    startTransition(async () => {
      const result = await updateBookingNotes(booking.appointment!.id, notes)
      if (result.success) { setNotesSaved(true); setActionFeedback("Notes saved"); setTimeout(() => setActionFeedback(null), 1200) }
    })
  }

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/20" />

      <motion.div key="drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }} className="fixed right-0 top-0 z-50 bg-white max-md:h-full md:h-[90vh] max-md:w-full md:w-[540px] overflow-y-auto" style={{ boxShadow: "-8px 0 40px rgba(15,23,42,.08)" }}>
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-[17px] font-bold text-slate-900">Booking Details</h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${sc.bg} ${sc.text} ${sc.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${displayStatus === "PENDING" ? "animate-pulse" : ""}`} />
                {sc.label}
              </span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-5 pb-6 flex flex-col gap-5">
          {/* Patient Information */}
          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center"><User className="w-3.5 h-3.5 text-blue-500" /></div>
              Patient Information
            </h3>
            <div className="flex flex-col gap-3">
              <InfoRow label="Full Name" value={booking.patient.fullName} />
              <InfoRow label="Phone" value={booking.patient.phone} />
              <div className="flex gap-6">
                <InfoRow label="Gender" value={booking.patient.gender} />
                <InfoRow label="Age" value={`${calcAge(booking.patient.dateOfBirth)} years`} />
              </div>
            </div>
          </section>

          {/* Appointment Information */}
          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-violet-500" /></div>
              Appointment Information
            </h3>
            <div className="flex flex-col gap-3">
              {booking.branch && <InfoRow label="Branch" value={booking.branch.name} icon={Building2} />}
              <InfoRow label="Doctor" value={`Dr. ${booking.doctor.name}`} icon={Stethoscope} />
              {booking.appointment?.dateTime && (<><InfoRow label="Date" value={fmtDate(booking.appointment.dateTime)} icon={Calendar} /><InfoRow label="Time" value={fmtTime(booking.appointment.dateTime)} icon={Clock} /></>)}
              <InfoRow label="Booked At" value={fmtDateTime(booking.createdAt)} icon={Clock} />
              <InfoRow label="Source" value="Online Booking" />
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200/60">
                <span className="text-xs text-slate-400 font-medium">Reference</span>
                <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">#{booking.id.slice(-8).toUpperCase()}</span>
              </div>
            </div>
          </section>

          {/* Internal Notes */}
          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-amber-500" /></div>
              Internal Notes
            </h3>
            <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setNotesSaved(false) }} rows={3} placeholder="Add internal notes..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all resize-none" />
            <div className="flex items-center justify-between mt-2.5">
              {!notesSaved && <span className="text-[11px] text-amber-600 font-medium">Unsaved changes</span>}
              <button onClick={handleSaveNotes} disabled={isPending || notesSaved} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"><Save className="w-3 h-3" /> Save</button>
            </div>
          </section>

          {booking.appointment?.visit && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-cyan-50 border border-cyan-100">
              <div className="w-8 h-8 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0"><LogIn className="w-4 h-4 text-cyan-600" /></div>
              <div>
                <p className="text-sm font-semibold text-cyan-800">Checked In</p>
                <p className="text-[11px] text-cyan-600">{booking.appointment.visit.checkedInAt ? `at ${fmtTime(new Date(booking.appointment.visit.checkedInAt))}` : ""} · Waiting Room</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white px-6 py-5 border-t border-slate-100 space-y-2.5">
          <AnimatePresence>
            {actionFeedback && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="text-center py-2.5 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">{actionFeedback}</motion.div>
            )}
          </AnimatePresence>

          {isTerminal && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-400"><Info className="w-4 h-4" /> This booking has been {currentStatus.toLowerCase().replace("_", " ")}</div>
          )}

          {!isTerminal && (
            <div className="grid grid-cols-2 gap-2.5">
              {currentStatus === "PENDING" && (
                <button onClick={() => { setCurrentStatus("CONFIRMED"); handleAction(() => confirmBooking(booking.id), "Booking confirmed", "CONFIRMED") }} disabled={isPending} className="h-11 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #3B82F6, #06B6D4)" }}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirm
                </button>
              )}
              {(currentStatus === "PENDING" || currentStatus === "CONFIRMED") && (
                <button onClick={() => { setCurrentStatus("CANCELLED"); handleAction(() => cancelBooking(booking.id), "Booking cancelled", "CANCELLED") }} disabled={isPending} className="h-11 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-red-600 bg-white border-2 border-red-200 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 active:scale-[0.98]">
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              )}
              <a href={`tel:${booking.patient.phone}`} className="h-11 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 transition-all duration-200"><Phone className="w-4 h-4" /> Call</a>
              <a href={`https://wa.me/${phone}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="h-11 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-emerald-700 bg-white border-2 border-emerald-200 hover:bg-emerald-50 transition-all duration-200"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
            </div>
          )}

          {/* ✅ زر الـ Check-in الجديد */}
          {(currentStatus === "CONFIRMED" || currentStatus === "PENDING") && !booking.appointment?.visit && (
            <button
              onClick={handleCheckIn}
              disabled={isPending}
              className="w-full h-12 flex items-center justify-center gap-2.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-500/20 disabled:opacity-50 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #15B8A6, #3B82F6)" }}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Check In Patient <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* ✅ إعادة استخدام Payment Dialog الخاص بالـ Walk-in بدون أي تعديل */}
      {pendingCheckIn && (
        <PreVisitPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          onPaymentComplete={handlePaymentComplete}
          appointmentId={pendingCheckIn.appointmentId}
          patientId={pendingCheckIn.patientId}
          patientName={pendingCheckIn.patientName}
          clinicId={clinicId}
          branchId={booking.branchId || undefined} // ✅ FIX: تحويل null إلى undefined
          paymentPolicy={pendingCheckIn.policy}
        />
      )}
    </AnimatePresence>
  )
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <div className="flex items-center gap-1.5 text-right">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-300" />}
        <span className="text-sm font-semibold text-slate-800">{value}</span>
      </div>
    </div>
  )
}