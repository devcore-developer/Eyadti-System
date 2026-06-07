"use client"

import { useState } from "react"
import { User, Phone, Mail, FileText, Loader2 } from "lucide-react"

interface PatientInfoFormProps {
  onSubmit: (data: any) => Promise<void>
  submitting: boolean
  onBack: () => void
}

export function PatientInfoForm({ onSubmit, submitting, onBack }: PatientInfoFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    gender: "MALE",
    notes: ""
  })
  const [error, setError] = useState("")

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
      <h2 className="text-lg font-semibold text-gray-900">Your Information</h2>
      
      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

      <div className="relative">
        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          name="fullName"
          placeholder="Full Name *"
          required
          value={formData.fullName}
          onChange={handleChange}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
      </div>

      <div className="relative">
        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number *"
          required
          value={formData.phone}
          onChange={handleChange}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
      </div>

      <div className="relative">
        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="email"
          name="email"
          placeholder="Email (Optional)"
          value={formData.email}
          onChange={handleChange}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
      </div>

      <select
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
      >
        <option value="MALE">Male</option>
        <option value="FEMALE">Female</option>
      </select>

      <div className="relative">
        <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <textarea
          name="notes"
          placeholder="Notes or Chief Complaint (Optional)"
          rows={2}
          value={formData.notes}
          onChange={handleChange}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Booking"}
        </button>
      </div>
    </form>
  )
}