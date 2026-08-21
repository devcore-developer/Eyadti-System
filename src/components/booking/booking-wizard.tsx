"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  getAvailableTimeSlots,
  createBooking,
  getBranches,
  getDoctorsByBranch,
  getAvailableDoctors,
} from "@/lib/actions/booking"
import { AvailableSlots } from "./available-slots"
import { PatientInfoForm } from "./patient-info-form"
import { PublicWaitingTimer } from "./public-waiting-timer"
import { useBookingLang, getLocalizedSpecialty, getLocalizedDegree, getLocalizedDays, formatTimeLocalized, type Lang } from "./booking-localization"
import type { PaymentWorkflowType } from "@/types"
import {
  Loader2, Calendar, Clock, User, CheckCircle2, MapPin, Phone, Mail, ArrowRight, ChevronLeft, ChevronRight,
  Building2, Stethoscope, Award, ShieldCheck, Globe, Zap, ExternalLink, Star, Check, Wallet, CreditCard, Banknote,
} from "lucide-react"

/* ───────────────────── Types ───────────────────── */

type Doctor = {
  id: string
  name: string
  nameAr?: string | null
  nameEn?: string | null
  image?: string | null
  specialty?: string | null
  degree?: string | null
  workingDays: string[]
  allBranchAccess?: boolean
  consultationFee?: number | null
}

type Branch = {
  id: string
  name: string
  nameAr?: string | null
  nameEn?: string | null
  code: string
  city: string | null
  address?: string | null
}

type Clinic = {
  name: string
  nameAr?: string | null
  nameEn?: string | null
  logoUrl?: string | null
  phone?: string | null
  address?: string | null
  email?: string | null
  website?: string | null
  emergencyPhone?: string | null
  specialty?: string | null
}

/* ───────────────────── Animation Variants ───────────────────── */

const fadeSlide = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const },
}

/* ───────────────────── Step Config ───────────────────── */

const STEPS = [
  { key: "branch", label_en: "Branch", label_ar: "الفرع", icon: Building2 },
  { key: "doctor", label_en: "Doctor", label_ar: "الطبيب", icon: Stethoscope },
  { key: "date", label_en: "Date", label_ar: "التاريخ", icon: Calendar },
  { key: "time", label_en: "Time", label_ar: "الوقت", icon: Clock },
  { key: "patient", label_en: "Patient", label_ar: "البيانات", icon: User },
  { key: "confirm", label_en: "Confirm", label_ar: "تأكيد", icon: CheckCircle2 },
]

/* ═══════════════════════════════════════════════════════
   MAIN BOOKING WIZARD
   ═══════════════════════════════════════════════════════ */

export function BookingWizard({ clinic, clinicId, slug, workflow = "PAY_AFTER_VISIT" }: { clinic: Clinic; clinicId: string; slug: string; workflow?: PaymentWorkflowType }) {
  const { lang, setLang, t, isRTL } = useBookingLang()
  
  const [step, setStep] = useState(1)
  const [branches, setBranches] = useState<Branch[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [appointmentId, setAppointmentId] = useState("")
  const [error, setError] = useState("")
  const [firstManualStep, setFirstManualStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [patientData, setPatientData] = useState<Record<string, string>>({})

  const markCompleted = useCallback((s: number) => {
    setCompletedSteps((prev) => new Set([...prev, s]))
  }, [])

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true)
      setError("")
      try {
        const data = await getBranches(clinicId)
        const activeBranches = (data || []).filter((b: Branch) => (b as any).isActive !== false)
        setBranches(activeBranches)

        if (activeBranches.length === 1) {
          setSelectedBranch(activeBranches[0])
          markCompleted(1)
          const docs = await getDoctorsByBranch(clinicId, activeBranches[0].id)
          setDoctors(docs || [])
          if (!docs || docs.length === 0) setError(t("err_no_branch_docs"))
          else setStep(2)
          setFirstManualStep(2)
        } else if (activeBranches.length === 0) {
          markCompleted(1)
          const allDocs = await getAvailableDoctors(clinicId)
          setDoctors(allDocs || [])
          if (!allDocs || allDocs.length === 0) setError(t("err_no_docs"))
          else setStep(2)
          setFirstManualStep(2)
        }
      } catch {
        setError(t("err_branches"))
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [clinicId, markCompleted, t])

  const handleBranchSelect = async (branch: Branch) => {
    setSelectedBranch(branch)
    setLoading(true)
    setError("")
    try {
      const data = await getDoctorsByBranch(clinicId, branch.id)
      setDoctors(data || [])
      markCompleted(1)
      if (!data || data.length === 0) setError(t("err_no_branch_docs"))
      else setStep(2)
    } catch {
      setError(t("err_failed_docs"))
    } finally {
      setLoading(false)
    }
  }

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    markCompleted(2)
    setStep(3)
  }

  const handleDateSelect = async (selectedDate: string) => {
    setDate(selectedDate)
    setTime("")
    setLoading(true)
    setError("")
    try {
      if (!selectedDoctor) return
      const available = await getAvailableTimeSlots(selectedDoctor.id, clinicId, selectedDate, selectedBranch?.id)
      setSlots(available)
      markCompleted(3)
      if (available.length === 0) setError(t("err_no_slots"))
      else setStep(4)
    } catch {
      setError(t("err_failed_slots"))
    } finally {
      setLoading(false)
    }
  }

  const handleTimeSelect = (selectedTime: string) => {
    setTime(selectedTime)
    markCompleted(4)
    setStep(5)
  }

  const handleSubmit = async (formData: Record<string, string>) => {
    console.log("[WIZARD] Patient form submitted:", formData)
    setPatientData(formData)
    markCompleted(5)
    setStep(6)
  }

  // ═══════════════════════════════════════════════════════
  // ✅ FIX: handleFinalConfirm مع error handling محسّن
  // ═══════════════════════════════════════════════════════
  const handleFinalConfirm = async () => {
    setSubmitting(true)
    setError("")
    
    console.log("=== [WIZARD] handleFinalConfirm called ===")
    console.log("[WIZARD] clinicId:", clinicId)
    console.log("[WIZARD] patientData:", patientData)
    console.log("[WIZARD] doctorId:", selectedDoctor?.id)
    console.log("[WIZARD] branchId:", selectedBranch?.id)
    console.log("[WIZARD] date:", date)
    console.log("[WIZARD] time:", time)
    
    try {
      const payload = {
        fullName: patientData.fullName,
        phone: patientData.phone,
        email: patientData.email || "",
        gender: patientData.gender || "MALE",
        notes: patientData.notes || "",
        doctorId: selectedDoctor?.id,
        branchId: selectedBranch?.id || "",
        date,
        time,
      }
      
      console.log("[WIZARD] Sending payload:", JSON.stringify(payload, null, 2))
      
      const result = await createBooking(clinicId, payload)
      
      console.log("[WIZARD] Result:", JSON.stringify(result, null, 2))
      
      if (result.success && result.appointmentId) {
        console.log("[WIZARD] ✅ Booking successful! Appointment ID:", result.appointmentId)
        setAppointmentId(result.appointmentId)
        markCompleted(6)
        setStep(7)
      } else {
        console.error("[WIZARD] ❌ Booking failed:", result.error)
        const errorMsg = result.error || t("err_failed")
        setError(errorMsg)
        // ✅ لا تعود لخطوة سابقة - اعرض الخطأ فقط
      }
    } catch (err) {
      console.error("[WIZARD] ❌ Exception in handleFinalConfirm:", err)
      setError(t("err_failed"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    if (step > firstManualStep) setStep(step - 1)
  }

  const goBackToStep = (targetStep: number) => {
    if (targetStep >= firstManualStep && targetStep < step) setStep(targetStep)
  }

  const formatDate = (d: string) => {
    if (!d) return ""
    const dateObj = new Date(d + "T00:00:00")
    return dateObj.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  }

  const formatTime12 = (timeStr: string) => formatTimeLocalized(timeStr, lang)

  const getPaymentMessage = () => {
    if (workflow === "PAY_BEFORE_VISIT") {
      return { text: lang === 'ar' ? "يرجى التوجه لمكتب الاستقبال عند الوصول لإتمام الدفع قبل الكشف." : "Please proceed to the reception desk upon arrival to complete the payment before your consultation.", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: Banknote }
    }
    if (workflow === "SPLIT_PAYMENT") {
      return { text: lang === 'ar' ? "سيتم تحصيل رسوم الاستشارة في الاستقبال. أي رسوم إضافية بعد الكشف." : "A consultation fee will be collected at reception. Procedure fees billed after.", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", icon: CreditCard }
    }
    return { text: lang === 'ar' ? "لا يلزم دفع أي رسوم الآن. يمكنك سداد الفاتورة في العيادة بعد الكشف." : "No payment is required right now. You will settle the bill at the clinic after your consultation.", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: Wallet }
  }
  
  const paymentInfo = getPaymentMessage()
  const PaymentIcon = paymentInfo.icon

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="max-w-[1500px] mx-auto px-5 lg:px-10 py-8 lg:py-10 overflow-x-hidden font-[var(--font-cairo)]">
      {/* Language Switcher */}
      <div className="flex justify-end mb-6">
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <button onClick={() => setLang('ar')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${lang === 'ar' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-800'}`}>العربية</button>
          <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${lang === 'en' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-800'}`}>English</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-9">
        <div className="w-full lg:w-[360px] lg:shrink-0">
          <ClinicCard clinic={clinic} />
          <SecurityCard />
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-[30px] p-6 lg:p-9 relative overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(15,23,42,.06)" }}>
            
            <div className="mb-8">
              <StepIndicator currentStep={step <= 6 ? step : 6} completedSteps={completedSteps} />
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ✅ FIX: Error Display - دائماً مرئي ولا يختفي */}
            {/* ═══════════════════════════════════════════════════════ */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -8 }} 
                  className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-2xl mb-6 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">!</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{error}</p>
                    <button 
                      onClick={() => setError("")}
                      className="text-red-500 hover:text-red-700 text-xs mt-1 underline"
                    >
                      {lang === 'ar' ? 'إغلاق' : 'Dismiss'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {loading && step > 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex flex-col justify-center items-center rounded-[30px]">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
                  <p className="text-sm font-semibold text-slate-600 animate-pulse">{t("finding_availability")}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* STEP 1: Branch */}
              {step === 1 && (
                <motion.div key="step-1" {...fadeSlide}>
                  <SectionHeader icon={Building2} title={t("select_branch")} subtitle={t("select_branch_desc")} />
                  <div className="space-y-3 mt-6">
                    {branches.map((branch) => (
                      <button key={branch.id} onClick={() => handleBranchSelect(branch)} className="w-full group flex items-center gap-4 p-5 bg-white border-2 border-gray-100 hover:border-blue-400 rounded-[22px] transition-all text-start hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all shrink-0"><Building2 className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900">{lang === 'ar' ? (branch.nameAr || branch.name) : (branch.nameEn || branch.name)}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{branch.city}{branch.address ? ` · ${branch.address}` : ""}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Doctor */}
              {step === 2 && (
                <motion.div key="step-2" {...fadeSlide}>
                  <BackButton onClick={() => setStep(1)} label={branches.length > 1 ? t("change_branch") : t("back")} />
                  <SectionHeader icon={Stethoscope} title={t("our_specialists")} subtitle={t("select_doctor_desc")} />
                  <div className="space-y-3 mt-6">
                    {doctors.map((doctor) => (
                      <button key={doctor.id} onClick={() => handleDoctorSelect(doctor)} className="w-full group flex items-center gap-4 p-5 bg-white border-2 border-gray-100 hover:border-blue-400 rounded-[22px] transition-all text-start hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden">
                        <div className="relative shrink-0">
                          <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                            {doctor.image ? <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-slate-400" />}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-700 transition-colors">
                            {lang === 'ar' ? (doctor.nameAr || `د. ${doctor.name}`) : (doctor.nameEn || `Dr. ${doctor.name}`)}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {doctor.specialty && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 tracking-wide">
                                {getLocalizedSpecialty(doctor.specialty, lang)}
                              </span>
                            )}
                            {doctor.degree && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                                <Award className="w-3 h-3" /> {getLocalizedDegree(doctor.degree, lang)}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {doctor.workingDays.slice(0, 4).map((day) => (<span key={day} className="text-[10px] font-semibold px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">{day}</span>))}
                            {doctor.workingDays.length > 4 && <span className="text-[10px] text-slate-400 font-medium">+{doctor.workingDays.length - 4}</span>}
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Date */}
              {step === 3 && (
                <motion.div key="step-3" {...fadeSlide}>
                  <BackButton onClick={handleBack} label={t("back_to_doctors")} />
                  <SectionHeader icon={Calendar} title={t("select_date")} subtitle={t("select_date_desc")} />
                  <div className="mt-6 max-w-sm mx-auto"><MiniCalendar selectedDate={date} onSelect={handleDateSelect} lang={lang} /></div>
                </motion.div>
              )}

              {/* STEP 4: Time */}
              {step === 4 && (
                <motion.div key="step-4" {...fadeSlide}>
                  <BackButton onClick={() => goBackToStep(3)} label={t("change_date")} />
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <SectionHeader icon={Clock} title={t("available_times")} subtitle={t("available_times_desc")} />
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">{formatDate(date)}</span>
                  </div>
                  <div className="mt-5 max-h-[400px] overflow-y-auto -mx-2 px-2 pb-2"><AvailableSlots slots={slots} selectedTime={time} onSelect={handleTimeSelect} /></div>
                </motion.div>
              )}

              {/* STEP 5: Patient */}
              {step === 5 && (
                <motion.div key="step-5" {...fadeSlide}>
                  <BackButton onClick={() => goBackToStep(4)} label={t("back_to_times")} />
                  <SectionHeader icon={User} title={t("your_details")} subtitle={t("your_details_desc")} />
                  <div className="mt-6"><PatientInfoForm onSubmit={handleSubmit} submitting={submitting} /></div>
                </motion.div>
              )}

              {/* STEP 6: Confirm / Review */}
              {step === 6 && (
                <motion.div key="step-6" {...fadeSlide}>
                  <BackButton onClick={() => goBackToStep(5)} label={t("edit_details")} />
                  <SectionHeader icon={CheckCircle2} title={t("review_confirm")} subtitle={t("review_confirm_desc")} />

                  <div className="mt-6 space-y-4">
                    <SummaryRow label={t("clinic")} value={lang === 'ar' ? (clinic.nameAr || clinic.name) : (clinic.nameEn || clinic.name)} />
                    {selectedBranch && <SummaryRow label={t("branch")} value={lang === 'ar' ? (selectedBranch.nameAr || selectedBranch.name) : (selectedBranch.nameEn || selectedBranch.name)} />}
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("doctor")}</span>
                      <div className="flex items-center gap-2.5">
                        {selectedDoctor?.image && <img src={selectedDoctor.image} alt="" className="w-7 h-7 rounded-lg object-cover" />}
                        <span className="font-semibold text-slate-900 text-sm">{lang === 'ar' ? (selectedDoctor?.nameAr || `د. ${selectedDoctor?.name}`) : (selectedDoctor?.nameEn || `Dr. ${selectedDoctor?.name}`)}</span>
                      </div>
                    </div>

                    <SummaryRow label={t("date")} value={formatDate(date)} />
                    
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-blue-100" style={{ background: "linear-gradient(135deg, #EFF6FF, #F0FDFA)" }}>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t("time")}</span>
                      <span className="font-bold text-blue-900 text-sm">{formatTime12(time)}</span>
                    </div>

                    {selectedDoctor?.consultationFee && <SummaryRow label={t("consultation_fee")} value={`${selectedDoctor.consultationFee} EGP`} highlight />}
                  </div>

                  <div className={`mt-6 p-4 rounded-2xl border ${paymentInfo.bg} ${paymentInfo.border}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${paymentInfo.bg} flex items-center justify-center shrink-0 border ${paymentInfo.border}`}><PaymentIcon className={`w-5 h-5 ${paymentInfo.color}`} /></div>
                      <div><p className={`text-sm font-bold ${paymentInfo.color} mb-1`}>{t("pay_instructions")}</p><p className={`text-xs ${paymentInfo.color} leading-relaxed opacity-90`}>{paymentInfo.text}</p></div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button onClick={handleBack} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200">{t("back")}</button>
                    <button 
                      onClick={handleFinalConfirm} 
                      disabled={submitting} 
                      className="flex-1 py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none" 
                      style={{ background: "linear-gradient(135deg, #3B82F6, #06B6D4)" }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("confirming")}
                        </>
                      ) : (
                        <>
                          {t("confirm_booking")}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 7: Success */}
              {step === 7 && appointmentId && (
                <motion.div key="step-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const }} className="flex flex-col items-center justify-center py-12 text-center space-y-7">
                  <div className="relative">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center"><CheckCircle2 className="w-12 h-12 text-emerald-600" strokeWidth={1.5} /></div>
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-60" />
                  </div>

                  <div className="max-w-sm space-y-3">
                    <h2 className="text-2xl font-bold text-slate-900">{t("booking_submitted")}</h2>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {t("booking_success_msg")}<br />{t("pending_status")}<br />
                      {workflow === "PAY_BEFORE_VISIT" ? t("pay_before_msg") : workflow === "SPLIT_PAYMENT" ? t("split_pay_msg") : t("normal_pay_msg")}
                    </p>
                  </div>

                  <PublicWaitingTimer dateStr={date} timeStr={time} />

                  <div className="w-full max-w-xs bg-slate-50 p-5 rounded-2xl border border-slate-100 text-start space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("reference")}</span>
                      <span className="font-mono text-sm font-bold text-slate-700">#{appointmentId.slice(-8).toUpperCase()}</span>
                    </div>
                    <SummaryRow label={t("doctor")} value={lang === 'ar' ? (selectedDoctor?.nameAr || `د. ${selectedDoctor?.name}`) : (selectedDoctor?.nameEn || `Dr. ${selectedDoctor?.name}`)} compact />
                    {selectedBranch && <SummaryRow label={t("branch")} value={lang === 'ar' ? (selectedBranch.nameAr || selectedBranch.name) : (selectedBranch.nameEn || selectedBranch.name)} compact />}
                    <SummaryRow label={t("date")} value={formatDate(date)} compact />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{t("time")}</span>
                      <span className="font-bold text-blue-600 text-sm bg-blue-50 px-2.5 py-0.5 rounded-lg">{formatTime12(time)}</span>
                    </div>
                  </div>

                  {(clinic.address || selectedBranch?.address) && (
                    <div className="w-full max-w-xs bg-white p-5 rounded-2xl border border-slate-100 text-start space-y-3 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5"><MapPin className="w-[18px] h-[18px] text-blue-600" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t("clinic_location")}</p>
                          <p className="text-sm font-medium text-slate-800 leading-relaxed">{selectedBranch?.address || clinic.address}</p>
                        </div>
                      </div>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBranch?.address || clinic.address || '')}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors"><ExternalLink className="w-4 h-4" />{t("open_maps")}</a>
                    </div>
                  )}

                  <a href={`/book/${slug}`} className="w-full max-w-xs py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-semibold text-sm shadow-lg shadow-slate-300/30 flex items-center justify-center gap-2 group">{t("book_another")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <FeatureCards />
    </div>
  )
}

/* ───────────────────── Shared Sub-Components ───────────────────── */

function StepIndicator({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) {
  const { lang } = useBookingLang()
  return (
    <div className="flex items-center overflow-x-auto pb-1 -mx-1 px-1 lg:overflow-visible scrollbar-hide">
      {STEPS.map((step, i) => {
        const num = i + 1; const isCompleted = completedSteps.has(num) || currentStep > num; const isCurrent = currentStep === num; const Icon = step.icon
        const label = lang === 'ar' ? step.label_ar : step.label_en
        return (
          <div key={step.key} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted ? "text-white shadow-md" : isCurrent ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/10" : "bg-white border-2 border-gray-200 text-slate-400"}`} style={isCompleted ? { background: "linear-gradient(135deg, #3B82F6, #06B6D4)" } : undefined}>{isCompleted ? <Check className="w-4 h-4" strokeWidth={2.5} /> : <Icon className="w-4 h-4" />}</div>
              <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isCompleted || isCurrent ? "text-blue-600" : "text-slate-400"}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (<div className="w-8 lg:w-12 h-0.5 mx-1.5 lg:mx-2.5 rounded-full bg-gray-200 relative overflow-hidden" style={{ marginTop: "-18px" }}><motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: "linear-gradient(90deg, #3B82F6, #06B6D4)" }} initial={false} animate={{ width: isCompleted ? "100%" : "0%" }} transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }} /></div>)}
          </div>
        )
      })}
    </div>
  )
}

function ClinicCard({ clinic }: { clinic: Clinic }) {
  const { lang } = useBookingLang()
  return (
    <div className="rounded-[32px] p-7 text-white relative overflow-hidden flex flex-col" style={{ background: "linear-gradient(135deg, #15B8A6, #3B82F6)", minHeight: 480, boxShadow: "0 30px 80px rgba(37,99,235,.18)" }}>
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 mb-5 overflow-hidden">{clinic.logoUrl ? <img src={clinic.logoUrl} alt="" className="w-full h-full object-cover" /> : <Stethoscope className="w-7 h-7 text-white" />}</div>
        <h2 className="text-xl font-bold leading-tight mb-1">{lang === 'ar' ? (clinic.nameAr || clinic.name) : (clinic.nameEn || clinic.name)}</h2>
        <div className="flex items-center gap-2 mb-5"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"><Check className="w-3 h-3" /> {("verified")}</span></div>
        <div className="flex items-center gap-1.5 mb-6">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="w-4 h-4 fill-amber-300 text-amber-300" />))}<span className="text-sm text-white/80 font-medium ml-1">5.0</span></div>
        <div className="space-y-3 flex-1">{clinic.address && <InfoRow icon={MapPin} text={clinic.address} />}{clinic.phone && <InfoRow icon={Phone} text={clinic.phone} />}{clinic.email && <InfoRow icon={Mail} text={clinic.email} />}</div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) { return (<div className="flex items-start gap-2.5"><Icon className="w-4 h-4 text-white/60 mt-0.5 shrink-0" /><span className="text-sm text-white/85 leading-snug">{text}</span></div>) }

function SecurityCard() { const { t } = useBookingLang(); return (<div className="mt-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(15,23,42,.04)] flex items-start gap-3.5"><div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5 text-emerald-600" /></div><div><p className="text-sm font-bold text-slate-800 mb-0.5">{t("secure_booking")}</p><p className="text-xs text-slate-500 leading-relaxed">{t("secure_desc")}</p></div></div>) }

function FeatureCards() {
  const { lang } = useBookingLang()
  const features = [
    { icon: Zap, title_en: "Instant Booking", title_ar: "حجز فوري", desc_en: "Book in under 60 seconds", desc_ar: "احجز في أقل من 60 ثانية", gradient: "from-blue-500 to-cyan-500" },
    { icon: Clock, title_en: "Real-time Availability", title_ar: "توافر لحظي", desc_en: "Live slot updates", desc_ar: "تحديث مباشر للمواعيد", gradient: "from-teal-500 to-emerald-500" },
    { icon: ShieldCheck, title_en: "Secure Booking", title_ar: "حجز آمن", desc_en: "256-bit encryption", desc_ar: "تشفير 256-بت", gradient: "from-violet-500 to-purple-500" },
    { icon: Globe, title_en: "24/7 Online", title_ar: "متاح 24 ساعة", desc_en: "Book anytime, anywhere", desc_ar: "احجز في أي وقت، من أي مكان", gradient: "from-amber-500 to-orange-500" },
  ]
  return (<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">{features.map((f) => (<div key={f.title_en} className="group p-5 rounded-[24px] border border-gray-100/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50" style={{ background: "rgba(255,255,255,.7)", backdropFilter: "blur(20px)" }}><div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3.5 shadow-lg shadow-slate-200/50`}><f.icon className="w-5 h-5 text-white" /></div><h3 className="text-sm font-bold text-slate-800 mb-0.5">{lang === 'ar' ? f.title_ar : f.title_en}</h3><p className="text-xs text-slate-500">{lang === 'ar' ? f.desc_ar : f.desc_en}</p></div>))}</div>)
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) { return (<div><div className="flex items-center gap-3 mb-1.5"><div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Icon className="w-[18px] h-[18px] text-blue-600" /></div><h2 className="text-[22px] font-bold text-slate-900 tracking-tight">{title}</h2></div><p className="text-sm text-slate-500 ms-12">{subtitle}</p></div>) }

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  const { isRTL } = useBookingLang()
  const Chevron = isRTL ? ChevronRight : ChevronLeft
  const btnLabel = label
  return (
    <button type="button" onClick={onClick} className="mb-5 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group">
      <Chevron className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      <span>{btnLabel}</span>
    </button>
  )
}

function SummaryRow({ label, value, highlight = false, compact = false }: { label: string; value: string; highlight?: boolean; compact?: boolean }) { return (<div className={`flex items-center justify-between ${compact ? "" : "p-4 bg-slate-50 rounded-2xl border border-slate-100"}`}><span className={`font-bold uppercase tracking-wider ${compact ? "text-xs text-slate-500" : "text-[11px] text-slate-400"}`}>{label}</span><span className={`font-semibold ${highlight ? "text-blue-600 text-sm" : compact ? "text-sm text-slate-900" : "text-sm text-slate-900"}`}>{value}</span></div>) }

/* ───────────────────── Mini Calendar ───────────────────── */
function MiniCalendar({ selectedDate, onSelect, lang }: { selectedDate: string; onSelect: (date: string) => void; lang: string }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [viewDate, setViewDate] = useState(new Date(today))
  const year = viewDate.getFullYear(), month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const monthName = viewDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: "long", year: "numeric" })
  const dayNames = getLocalizedDays(lang as Lang)
  const canGoPrev = viewDate > today
  const isSameDay = (d: number) => selectedDate === `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  const isPast = (d: number) => new Date(year, month, d) < today
  const isWeekend = (d: number) => { const day = new Date(year, month, d).getDay(); return day === 0 || day === 5 }
  const isDisabled = (d: number) => isPast(d) || isWeekend(d)

  return (
    <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-[0_4px_20px_rgba(15,23,42,.04)]">
      <div className="flex items-center justify-between mb-5">
        <button type="button" onClick={() => canGoPrev && setViewDate(new Date(year, month - 1, 1))} disabled={!canGoPrev} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-[15px] font-bold text-slate-800">{monthName}</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">{dayNames.map((d) => (<div key={d} className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-2">{d}</div>))}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (<div key={`e-${i}`} />))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1; const disabled = isDisabled(day); const selected = isSameDay(day)
          return (<button key={day} type="button" disabled={disabled} onClick={() => onSelect(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)} className={`h-11 rounded-xl text-sm font-semibold transition-all duration-200 ${selected ? "text-white shadow-lg shadow-blue-500/25 scale-95" : disabled ? "text-slate-300 bg-slate-50 cursor-not-allowed" : isWeekend(day) ? "text-slate-400 bg-slate-50/50 hover:bg-slate-100" : "text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 border border-gray-100 hover:border-blue-200"}`} style={selected ? { background: "linear-gradient(135deg, #3B82F6, #06B6D4)" } : undefined}>{day}</button>)
        })}
      </div>
    </div>
  )
}