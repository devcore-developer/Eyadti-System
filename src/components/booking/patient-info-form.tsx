"use client"

import { useState } from "react"
import { User, Phone, Mail, FileText, Loader2, Check, AlertCircle } from "lucide-react"
import { useBookingLang } from "./booking-localization"

interface PatientInfoFormProps {
  onSubmit: (data: any) => Promise<void>
  submitting: boolean
}

function FloatingField({
  label, name, type = "text", icon: Icon, required = false, value, onChange, error, dir
}: {
  label: string; name: string; type?: string; icon: React.ElementType; required?: boolean
  value: string; onChange: (name: string, value: string) => void; error?: string; dir?: string
}) {
  const [focused, setFocused] = useState(false)
  const isActive = focused || value.length > 0
  const isValid = value.length > 0 && !error
  const hasError = error && value.length > 0

  const inputClasses = `
    w-full pl-12 pr-11 pt-6 pb-2 bg-slate-50 border-2 rounded-[18px] text-slate-900 text-[15px] transition-all duration-200 outline-none appearance-none ${
      hasError ? "border-red-400 shadow-[0_0_0_4px_rgba(239,68,68,.08)]" 
      : isValid ? "border-emerald-400 shadow-[0_0_0_4px_rgba(34,197,94,.08)]" 
      : isActive ? "border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,.1)] bg-white" 
      : "border-gray-200 hover:border-gray-300"
    }
  `

  return (
    <div className="relative">
      <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 z-10 ${hasError ? "text-red-500" : isActive ? "text-blue-500" : "text-slate-400"}`} />
      <input
        type={type} name={name} value={value} onChange={(e) => onChange(name, e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} required={required}
        dir={dir}
        className={inputClasses}
      />
      <label className={`absolute pointer-events-none transition-all duration-200 font-medium ${Icon ? "left-12" : "left-4"} ${isActive ? "top-2.5 text-[11px] " + (hasError ? "text-red-500" : isValid ? "text-emerald-600" : "text-blue-500") : "top-1/2 -translate-y-1/2 text-sm text-slate-400"}`}>
        {label}
      </label>
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        {isValid && <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />}
        {hasError && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>
      {hasError && <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{error}</p>}
    </div>
  )
}

export function PatientInfoForm({ onSubmit, submitting }: PatientInfoFormProps) {
  const { t } = useBookingLang()
  const [formData, setFormData] = useState({ fullName: "", phone: "", email: "", gender: "MALE", notes: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notesFocused, setNotesFocused] = useState(false)

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!formData.fullName.trim()) newErrors.fullName = t("err_fullname")
    if (!formData.phone.trim()) newErrors.phone = t("err_phone_req")
    else if (!/^[\d\s+()-]{7,}$/.test(formData.phone)) newErrors.phone = t("err_phone_inv")
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t("err_email_inv")
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        <FloatingField label={`${t("full_name")} *`} name="fullName" icon={User} required value={formData.fullName} onChange={handleChange} error={errors.fullName} />
        <FloatingField label={`${t("phone_number")} *`} name="phone" type="tel" icon={Phone} required value={formData.phone} onChange={handleChange} error={errors.phone} dir="ltr" />
        <FloatingField label={t("email_optional")} name="email" type="email" icon={Mail} value={formData.email} onChange={handleChange} error={errors.email} dir="ltr" />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 ml-1">{t("gender")}</label>
        <div className="grid grid-cols-2 gap-3">
          {(["MALE", "FEMALE"] as const).map((g) => (
            <button key={g} type="button" onClick={() => setFormData((prev) => ({ ...prev, gender: g }))}
              className={`py-3.5 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                formData.gender === g ? (g === "MALE" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm shadow-blue-500/10" : "bg-pink-50 border-pink-500 text-pink-700 shadow-sm shadow-pink-500/10") : "bg-slate-50 border-gray-200 text-slate-500 hover:bg-slate-100 hover:border-gray-300"
              }`}>
              <span>{g === "MALE" ? "♂" : "♀"}</span> {g === "MALE" ? t("male") : t("female")}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <FileText className={`absolute left-4 top-3.5 w-5 h-5 transition-colors duration-200 z-10 ${notesFocused ? "text-blue-500" : "text-slate-400"}`} />
        <textarea name="notes" value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} onFocus={() => setNotesFocused(true)} onBlur={() => setNotesFocused(false)} rows={3} placeholder={t("reason_visit")} className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 rounded-[18px] text-slate-900 text-[15px] transition-all duration-200 outline-none resize-none ${notesFocused ? "border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,.1)] bg-white" : "border-gray-200 hover:border-gray-300"}`} />
      </div>

      <button type="submit" disabled={submitting} className="w-full py-4 rounded-2xl text-white font-bold text-[16px] flex items-center justify-center gap-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none" style={{ background: "linear-gradient(135deg, #3B82F6, #06B6D4)" }}>
        {submitting ? (<><Loader2 className="w-5 h-5 animate-spin" /> {t("confirming")} /</>) : (<> {t("confirm_booking")} <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs">✓</span></>)}
      </button>
    </form>
  )
}