"use client"

import { useState } from "react"
import { User, Phone, Mail, FileText, Loader2 } from "lucide-react"

interface PatientInfoFormProps {
  onSubmit: (data: any) => Promise<void>
  submitting: boolean
  onBack?: () => void
}

export function PatientInfoForm({ onSubmit, submitting }: PatientInfoFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    gender: "MALE",
    notes: ""
  })
  const [error, setError] = useState("")
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!formData.fullName || !formData.phone) {
      setError("Name and Phone are required")
      return
    }

    await onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-teal-600" />
          Your Details
        </h3>
        
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 flex items-center gap-2"><span>⚠️</span> {error}</div>}

        {/* Name Input */}
        <div className="relative mb-4 group">
          <User className={`absolute left-4 top-3.5 h-5 w-5 transition-colors ${focused === 'name' ? 'text-teal-500' : 'text-gray-400'}`} />
          <input
            type="text"
            name="fullName"
            placeholder="Full Name *"
            required
            value={formData.fullName}
            onChange={handleChange}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:ring-0 focus:bg-white transition-all duration-200 outline-none ${focused === 'name' ? 'border-teal-500 shadow-lg shadow-teal-500/10' : 'border-transparent focus:border-gray-200'}`}
          />
        </div>

        {/* Phone Input */}
        <div className="relative mb-4 group">
          <Phone className={`absolute left-4 top-3.5 h-5 w-5 transition-colors ${focused === 'phone' ? 'text-teal-500' : 'text-gray-400'}`} />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number *"
            required
            value={formData.phone}
            onChange={handleChange}
            onFocus={() => setFocused('phone')}
            onBlur={() => setFocused(null)}
            className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:ring-0 focus:bg-white transition-all duration-200 outline-none ${focused === 'phone' ? 'border-teal-500 shadow-lg shadow-teal-500/10' : 'border-transparent focus:border-gray-200'}`}
          />
        </div>

        {/* Email Input */}
        <div className="relative mb-4 group">
          <Mail className={`absolute left-4 top-3.5 h-5 w-5 transition-colors ${focused === 'email' ? 'text-teal-500' : 'text-gray-400'}`} />
          <input
            type="email"
            name="email"
            placeholder="Email (Optional)"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:ring-0 focus:bg-white transition-all duration-200 outline-none ${focused === 'email' ? 'border-teal-500 shadow-lg shadow-teal-500/10' : 'border-transparent focus:border-gray-200'}`}
          />
        </div>

        {/* Gender Select */}
        <div className="grid grid-cols-2 gap-3 mb-4">
           <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, gender: "MALE" }))}
            className={`py-3 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-center gap-2 ${formData.gender === "MALE" ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
          >
            <span>♂</span> Male
          </button>
           <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, gender: "FEMALE" }))}
            className={`py-3 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-center gap-2 ${formData.gender === "FEMALE" ? 'bg-pink-50 border-pink-500 text-pink-700' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
          >
            <span>♀</span> Female
          </button>
        </div>

        {/* Notes Textarea */}
        <div className="relative group">
          <FileText className={`absolute left-4 top-3.5 h-5 w-5 transition-colors ${focused === 'notes' ? 'text-teal-500' : 'text-gray-400'}`} />
          <textarea
            name="notes"
            placeholder="Reason for visit (Optional)"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            onFocus={() => setFocused('notes')}
            onBlur={() => setFocused(null)}
            className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:ring-0 focus:bg-white transition-all duration-200 outline-none resize-none ${focused === 'notes' ? 'border-teal-500 shadow-lg shadow-teal-500/10' : 'border-transparent focus:border-gray-200'}`}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl hover:shadow-lg hover:shadow-teal-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none font-bold text-lg flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Booking...
          </>
        ) : (
          <>
            Confirm Appointment
            <span className="bg-white/20 p-1 rounded-full text-xs">✓</span>
          </>
        )}
      </button>
    </form>
  )
}