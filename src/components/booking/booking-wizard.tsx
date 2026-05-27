"use client"

import { useState, useEffect } from "react"
import { getAvailableTimeSlots, createBooking, getBranches, getDoctorsByBranch } from "@/lib/actions/booking"
import { BookingForm } from "./booking-form"
import { Loader2, Calendar, Clock, User, CheckCircle, Building2, ChevronRight } from "lucide-react"

type Doctor = { id: string; name: string; workingDays: string[] }
type Branch = { id: string; name: string; code: string; city: string | null }
type Clinic = {
  name: string
  logoUrl?: string | null
  phone?: string | null
  address?: string | null
}

interface Props {
  clinic: Clinic
  clinicId: string
}

export function BookingWizard({ clinic, clinicId }: Props) {
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

  // Load Branches on mount
  useEffect(() => {
    async function loadBranches() {
      setLoading(true)
      try {
        const data = await getBranches(clinicId) // Assume this action exists
        setBranches(data || [])
      } catch (err) {
        setError("Failed to load branches")
      } finally {
        setLoading(false)
      }
    }
    loadBranches()
  }, [clinicId])

  // Step 1 -> 2: Load Doctors for selected Branch
  const handleBranchSelect = async (branch: Branch) => {
    setSelectedBranch(branch)
    setLoading(true)
    setError("")
    try {
      const data = await getDoctorsByBranch(clinicId, branch.id) // Assume this action exists
      setDoctors(data || [])
      if (data.length === 0) setError("No doctors available at this branch")
      setStep(2)
    } catch {
      setError("Failed to load doctors")
    } finally {
      setLoading(false)
    }
  }

  // Step 2 -> 3: Select Doctor
  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setStep(3)
  }

  // Step 3 -> 4: Load Time Slots
  const handleDateSelect = async (selectedDate: string) => {
    setDate(selectedDate)
    setTime("")
    setLoading(true)
    setError("")
    try {
      if (!selectedDoctor) return
      const available = await getAvailableTimeSlots(selectedDoctor.id, clinicId, selectedDate)
      setSlots(available)
      if (available.length === 0) setError("No available slots for this date")
      setStep(4)
    } catch {
      setError("Failed to load slots")
    } finally {
      setLoading(false)
    }
  }

  // Step 4 -> 5: Submit Booking
  const handleSubmit = async (formData: any) => {
    setSubmitting(true)
    setError("")
    try {
      const result = await createBooking(clinicId, {
        ...formData,
        doctorId: selectedDoctor?.id,
        branchId: selectedBranch?.id,
        date,
        time,
      })
      if (result.success && result.appointmentId) {
        setAppointmentId(result.appointmentId)
        setStep(5)
      } else {
        setError(result.error || "Booking failed")
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const stepIcons = [Building2, User, Calendar, Clock, CheckCircle]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Book an Appointment</h1>
          <p className="text-sm text-gray-500">{clinic.name}</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {stepIcons.map((Icon, i) => (
            <div key={i} className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
              step > i + 1 ? 'bg-teal-600 text-white' : step === i + 1 ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'
            }`}>
              <Icon className="h-4 w-4" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : (
            <>
              {/* Step 1: Select Branch */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-semibold">1. Select Branch</h2>
                  <div className="space-y-2">
                    {branches.map((branch) => (
                      <div
                        key={branch.id}
                        onClick={() => handleBranchSelect(branch)}
                        className="flex items-center justify-between p-4 border rounded-lg hover:border-teal-300 hover:bg-teal-50/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-teal-600" />
                          <div>
                            <p className="font-medium text-gray-900">{branch.name}</p>
                            <p className="text-xs text-gray-500">{branch.city} - Code: {branch.code}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Select Doctor */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-semibold">2. Select Doctor at {selectedBranch?.name}</h2>
                  <div className="space-y-2">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        onClick={() => handleDoctorSelect(doctor)}
                        className="flex items-center justify-between p-4 border rounded-lg hover:border-teal-300 hover:bg-teal-50/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-teal-600" />
                          <div>
                            <p className="font-medium text-gray-900">Dr. {doctor.name}</p>
                            <p className="text-xs text-gray-500">Available: {doctor.workingDays.join(", ")}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:underline">← Choose another branch</button>
                </div>
              )}

              {/* Step 3: Select Date */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="font-semibold">3. Select Date for Dr. {selectedDoctor?.name}</h2>
                  <input
                    type="date"
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => handleDateSelect(e.target.value)}
                  />
                  <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:underline">← Choose another doctor</button>
                </div>
              )}

              {/* Step 4: Select Time */}
              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="font-semibold">4. Select Time - {date}</h2>
                  {slots.length === 0 ? (
                    <p className="text-sm text-gray-500">No slots available</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => { setTime(slot); setStep(5); }}
                          className={`p-2 text-sm rounded-lg border transition-colors ${time === slot ? 'bg-teal-600 text-white' : 'hover:border-teal-300'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:underline">← Choose another date</button>
                </div>
              )}

              {/* Step 5: Patient Info */}
              {step === 5 && !submitting && !appointmentId && (
                <BookingForm
                  defaultValues={{ date, time, doctorId: selectedDoctor?.id || "" }}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  onBack={() => setStep(4)}
                />
              )}
            </>
          )}

          {/* Confirmation Screen */}
          {appointmentId && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Booking Confirmed!</h2>
              <p className="text-gray-500 text-sm">Your appointment has been booked successfully.</p>
              
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-left space-y-2 mt-4">
                <p><strong>Branch:</strong> {selectedBranch?.name}</p>
                <p><strong>Doctor:</strong> Dr. {selectedDoctor?.name}</p>
                <p><strong>Date:</strong> {date}</p>
                <p><strong>Time:</strong> {time}</p>
                <p><strong>Booking ID:</strong> {appointmentId.substring(0, 8).toUpperCase()}</p>
              </div>

              <a href={`/book/confirmation/${appointmentId}`} className="text-teal-600 text-sm hover:underline block mt-4">
                View Full Details →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}