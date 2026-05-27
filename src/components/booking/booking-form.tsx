// src/components/booking/booking-form.tsx

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface Props {
  defaultValues: { date: string; time: string; doctorId: string }
  onSubmit: (data: any) => Promise<void>
  submitting: boolean
  onBack: () => void
}

export function BookingForm({ defaultValues, onSubmit, submitting, onBack }: Props) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    gender: "MALE",
    dateOfBirth: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...form, ...defaultValues })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-semibold">Patient Information</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
        <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
        <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+20 123 456 7890" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
        <select
          required
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          className="w-full border rounded-md p-2 text-sm"
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
        <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full border rounded-md p-2 text-sm"
          placeholder="Any specific concerns..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>Back</Button>
        <Button type="submit" disabled={submitting} className="flex-1 bg-teal-600 hover:bg-teal-700">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Booking"}
        </Button>
      </div>
    </form>
  )
}