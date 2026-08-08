"use client"
import { createContext, useContext, useState, ReactNode } from "react"

export type Lang = "ar" | "en"

const t = (lang: Lang, ar: string, en: string) => lang === 'ar' ? ar : en

// قواميس التخصصات الطبية (Mapping)
const specialtyMap: Record<string, { ar: string; en: string }> = {
  "Cardiology": { ar: "أمراض القلب", en: "Cardiology" },
  "Dentistry": { ar: "طب الأسنان", en: "Dentistry" },
  "Dermatology": { ar: "الجلدية", en: "Dermatology" },
  "Endocrinology": { ar: "الغدد الصماء", en: "Endocrinology" },
  "ENT": { ar: "أنف وأذن وحنجرة", en: "ENT" },
  "Gastroenterology": { ar: "الباطنة والجهاز الهضمي", en: "Gastroenterology" },
  "General Medicine": { ar: "طب عام", en: "General Medicine" },
  "General Surgery": { ar: "جراحة عامة", en: "General Surgery" },
  "Neurology": { ar: "الأعصاب", en: "Neurology" },
  "Obstetrics": { ar: "التوليد والنساء", en: "Obstetrics" },
  "Ophthalmology": { ar: "طب العيون", en: "Ophthalmology" },
  "Orthopedics": { ar: "العظام", en: "Orthopedics" },
  "Pediatrics": { ar: "طب الأطفال", en: "Pediatrics" },
  "Psychiatry": { ar: "الطب النفسي", en: "Psychiatry" },
  "Radiology": { ar: "الأشعة", en: "Radiology" },
  "Urology": { ar: "المسالك البولية", en: "Urology" },
}

// قواميس الدرجات العلمية
const degreeMap: Record<string, { ar: string; en: string }> = {
  "MD": { ar: "دكتوراه", en: "MD" },
  "MBBCh": { ar: "بكالوريوس الطب والجراحة", en: "MBBCh" },
  "Master's": { ar: "ماجستير", en: "Master's Degree" },
  "PhD": { ar: "دكتوراه", en: "PhD" },
  "Board": { ar: "زمالة", en: "Board" },
  "Fellowship": { ar: "زمالة تخصصية", en: "Fellowship" },
}

// أيام الأسبوع كاملة
const daysFull: Record<Lang, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
}

export function getLocalizedSpecialty(specialty: string | null | undefined, lang: Lang) {
  if (!specialty) return ""
  return specialtyMap[specialty]?.[lang] || specialty
}

export function getLocalizedDegree(degree: string | null | undefined, lang: Lang) {
  if (!degree) return ""
  return degreeMap[degree]?.[lang] || degree
}

export function getLocalizedDays(lang: Lang) {
  return daysFull[lang]
}

export function formatTimeLocalized(timeStr: string, lang: Lang) {
  if (!timeStr) return ""
  const [h, m] = timeStr.split(":").map(Number)
  const hour = h % 12 || 12
  const minutes = m.toString().padStart(2, "0")
  
  if (lang === 'ar') {
    if (h === 12) return `${hour}:${minutes} ظهرًا`
    if (h > 12) return `${hour}:${minutes} مساءً`
    return `${hour}:${minutes} صباحًا`
  }
  const ampm = h >= 12 ? "PM" : "AM"
  return `${hour}:${minutes} ${ampm}`
}

interface BookingLangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
  isRTL: boolean
}

const BookingLangContext = createContext<BookingLangContextType>({
  lang: "ar", setLang: () => {}, t: (key) => key, isRTL: true,
})

export function BookingLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar")
  const isRTL = lang === "ar"
  
  const t = (key: string) => {
    const map: Record<string, Record<Lang, string>> = {
      select_branch: { ar: "اختر الفرع", en: "Select Branch" },
      select_branch_desc: { ar: "اختر فرع العيادة المفضل لديك.", en: "Choose your preferred clinic branch." },
      our_specialists: { ar: "أطباؤنا المتخصصون", en: "Our Specialists" },
      select_doctor_desc: { ar: "اختر الطبيب المفضل لديك.", en: "Select your preferred doctor." },
      select_date: { ar: "اختر التاريخ", en: "Select Date" },
      select_date_desc: { ar: "اختر يوماً مناسباً لزيارتك.", en: "Choose a convenient day for your visit." },
      available_times: { ar: "الأوقات المتاحة", en: "Available Times" },
      available_times_desc: { ar: "اختر الوقت المناسب لك.", en: "Pick a time slot that works for you." },
      your_details: { ar: "بيانات المريض", en: "Patient Information" },
      your_details_desc: { ar: "يرجى تقديم بياناتك لإتمام الحجز.", en: "Please provide your information to complete the booking." },
      review_confirm: { ar: "مراجعة وتأكيد", en: "Review & Confirm" },
      review_confirm_desc: { ar: "يرجى التحقق من تفاصيل موعدك.", en: "Please verify your appointment details." },
      confirm_booking: { ar: "تأكيد الحجز", en: "Confirm Appointment" },
      confirming: { ar: "جارٍ التأكيد...", en: "Confirming..." },
      back: { ar: "رجوع", en: "Back" },
      change_branch: { ar: "تغيير الفرع", en: "Change Branch" },
      back_to_doctors: { ar: "العودة للأطباء", en: "Back to Doctors" },
      change_date: { ar: "تغيير التاريخ", en: "Change Date" },
      back_to_times: { ar: "العودة للأوقات", en: "Back to Times" },
      edit_details: { ar: "تعديل البيانات", en: "Edit Details" },
      clinic: { ar: "العيادة", en: "Clinic" },
      branch: { ar: "الفرع", en: "Branch" },
      doctor: { ar: "الطبيب", en: "Doctor" },
      date: { ar: "التاريخ", en: "Date" },
      time: { ar: "الوقت", en: "Time" },
      reference: { ar: "رقم المرجع", en: "Reference" },
      booking_submitted: { ar: "تم إرسال طلب الحجز", en: "Booking Request Submitted" },
      booking_success_msg: { ar: "تم استلام طلب حجزك بنجاح.", en: "Your booking request has been received." },
      pending_status: { ar: "الحالة: في انتظار التأكيد.", en: "Status: Pending Confirmation." },
      pay_before_msg: { ar: "يرجى الحضور قبل الموعد بـ 10 دقائق لسداد الرسوم في الاستقبال.", en: "Please arrive 10 mins early to pay at reception." },
      split_pay_msg: { ar: "يرجى الحضور قبل الموعد بـ 10 دقائق لسداد رسوم الاستشارة.", en: "Please arrive 10 mins early to pay the consultation fee." },
      normal_pay_msg: { ar: "سيقوم فريقنا بالتواصل معك للتأكيد.", en: "Our team will contact you to confirm." },
      clinic_location: { ar: "موقع العيادة", en: "Clinic Location" },
      open_maps: { ar: "فتح في خرائط جوجل", en: "Open in Google Maps" },
      book_another: { ar: "حجز موعد آخر", en: "Book Another Appointment" },
      secure_booking: { ar: "حجز آمن", en: "Secure Booking" },
      secure_desc: { ar: "بياناتك مشفرة باستخدام أعلى معايير الأمان. نحن لا نشارك معلوماتك مع أي جهة.", en: "Your data is encrypted using modern security standards. We never share your information." },
      verified: { ar: "موثق", en: "Verified" },
      finding_availability: { ar: "جارٍ البحث عن المواعيد...", en: "Finding availability..." },
      err_branches: { ar: "فشل في تحميل بيانات العيادة", en: "Failed to load clinic data" },
      err_no_docs: { ar: "لا يوجد أطباء متاحين للحجز حالياً.", en: "No doctors available for booking at the moment." },
      err_no_branch_docs: { ar: "لا يوجد أطباء متاحين في هذا الفرع", en: "No doctors available at this branch" },
      err_no_slots: { ar: "لا توجد مواعيد متاحة في هذا اليوم.", en: "No available slots for this date." },
      err_failed_slots: { ar: "فشل في تحميل المواعيد", en: "Failed to load slots" },
      err_failed_docs: { ar: "فشل في تحميل الأطباء", en: "Failed to load doctors" },
      err_slot_booked: { ar: "عذرًا، هذا الموعد لم يعد متاحًا. برجاء اختيار موعد آخر.", en: "Sorry, this appointment time is no longer available. Please choose another." },
      err_validation: { ar: "بيانات غير مكتملة", en: "Validation failed" },
      err_failed: { ar: "حدث خطأ غير متوقع", en: "An unexpected error occurred" },
      err_invalid_doc: { ar: "اختيار طبيب غير صالح.", en: "Invalid doctor selection." },
      err_invalid_branch: { ar: "اختيار فرع غير صالح.", en: "Invalid branch selection." },
      consultation_fee: { ar: "رسوم الاستشارة", en: "Consultation Fee" },
      pay_instructions: { ar: "إرشادات الدفع", en: "Payment Instructions" },
      location: { ar: "الموقع", en: "Location" },
      step_branch: { ar: "الفرع", en: "Branch" }, 
      step_doctor: { ar: "الطبيب", en: "Doctor" }, 
      step_date: { ar: "التاريخ", en: "Date" }, 
      step_time: { ar: "الوقت", en: "Time" }, 
      step_patient: { ar: "البيانات", en: "Patient" }, 
      step_confirm: { ar: "تأكيد", en: "Confirm" },
      // Form
      full_name: { ar: "الاسم بالكامل", en: "Full Name" },
      phone_number: { ar: "رقم الهاتف", en: "Phone Number" },
      email_optional: { ar: "البريد الإلكتروني (اختياري)", en: "Email (Optional)" },
      gender: { ar: "النوع", en: "Gender" },
      male: { ar: "ذكر", en: "Male" },
      female: { ar: "أنثى", en: "Female" },
      reason_visit: { ar: "سبب الزيارة (اختياري)", en: "Reason for Visit (Optional)" },
      err_fullname: { ar: "الاسم بالكامل مطلوب", en: "Full name is required" },
      err_phone_req: { ar: "رقم الهاتف مطلوب", en: "Phone number is required" },
      err_phone_inv: { ar: "أدخل رقم هاتف صحيح", en: "Enter a valid phone number" },
      err_email_inv: { ar: "أدخل بريد إلكتروني صحيح", en: "Enter a valid email" },
      // Timer
      starts_in: { ar: "يبدأ بعد", en: "Starts In" },
      waiting_time: { ar: "مدة الانتظار", en: "Waiting Time" },
      timer_arrive: { ar: "يرجى التأكد من الحضور قبل الموعد بـ 5 دقائق.", en: "Please make sure to arrive 5 minutes early." },
      timer_wait: { ar: "سيقوم الطبيب باستدعائك قريباً. يرجى الانتظار بصبر.", en: "The doctor will call you shortly. Please wait patiently." },
      // Features
      f_instant: { ar: "حجز فوري", en: "Instant Booking" },
      f_instant_d: { ar: "احجز في أقل من 60 ثانية", en: "Book in under 60 seconds" },
      f_realtime: { ar: "توافر لحظي", en: "Real-time Availability" },
      f_realtime_d: { ar: "تحديث مباشر للمواعيد", en: "Live slot updates" },
      f_secure: { ar: "حجز آمن", en: "Secure Booking" },
      f_secure_d: { ar: "تشفير 256-بت", en: "256-bit encryption" },
      f_247: { ar: "متاح 24 ساعة", en: "24/7 Online" },
      f_247_d: { ar: "احجز في أي وقت، من أي مكان", en: "Book anytime, anywhere" },
    }
    return map[key]?.[lang] || key
  }

  return (
    <BookingLangContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </BookingLangContext.Provider>
  )
}

export const useBookingLang = () => useContext(BookingLangContext)