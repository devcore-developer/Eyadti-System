"use client"

import { useState, useEffect } from "react"
import { getAvailableTimeSlots, createBooking, getBranches, getDoctorsByBranch } from "@/lib/actions/booking"
import { AvailableSlots } from "./available-slots"
import { PatientInfoForm } from "./patient-info-form"
import { Loader2, Calendar, Clock, User, CheckCircle, Building2, ChevronRight, ArrowLeft } from "lucide-react"

type Doctor = { id: string; name: string; workingDays: string[] }
type Branch = { id: string; name: string; code: string; city: string | null }
type Clinic = { name: string; logoUrl?: string | null; phone?: string | null; address?: string | null }

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

  useEffect(() => {
    async function loadBranches() {
      setLoading(true)
      try {
        const data = await getBranches(clinicId)
        setBranches(data || [])
      } catch (err) {
        setError("Failed to load branches")
      } finally {
        setLoading(false)
      }
    }
    loadBranches()
  }, [clinicId])

  const handleBranchSelect = async (branch: Branch) => {
    setSelectedBranch(branch)
    setLoading(true)
    setError("")
    try {
      const data = await getDoctorsByBranch(clinicId, branch.id)
      setDoctors(data || [])
      if (data.length === 0) setError("No doctors available at this branch")
      setStep(2)
    } catch {
      setError("Failed to load doctors")
    } finally {
      setLoading(false)
    }
  }

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setStep(3)
  }

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

  const stepLabels = ["Branch", "Doctor", "Date", "Time", "Details"]

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Clinic Header Card */}
      <div className="bg-teal-600 p-6 text-white text-center rounded-t-2xl">
        <h1 className="text-2xl font-bold">{clinic.name}</h1>
        {clinic.address && <p className="text-teal-100 text-sm mt-1">{clinic.address}</p>}
      </div>

      {/* Progress Bar */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > i + 1 ? "bg-teal-600 text-white" : step === i + 1 ? "bg-teal-100 text-teal-700 ring-2 ring-teal-600" : "bg-gray-100 text-gray-400"
              }`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className="text-[10px] mt-1 text-gray-500 hidden sm:block">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-100">{error}</div>}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-16 text-gray-400">
            <Loader2 className="h-10 w-10 animate-spin text-teal-500 mb-3" />
            <p className="text-sm">Loading...</p>
          </div>
        ) : (
          <>
            {/* Step 1: Select Branch */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg text-gray-900">Select Branch</h2>
                <div className="space-y-3">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      onClick={() => handleBranchSelect(branch)}
                      className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-teal-400 hover:bg-teal-50/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-teal-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{branch.name}</p>
                          <p className="text-xs text-gray-500">{branch.city}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-teal-600 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Select Doctor */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg text-gray-900">Select Doctor at {selectedBranch?.name}</h2>
                <div className="space-y-3">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => handleDoctorSelect(doctor)}
                      className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-teal-400 hover:bg-teal-50/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <User className="h-6 w-6 text-teal-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Dr. {doctor.name}</p>
                          <p className="text-xs text-gray-500">Available: {doctor.workingDays.join(", ")}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-teal-600 transition-colors" />
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:underline flex items-center gap-1 mt-4">
                  <ArrowLeft className="h-3 w-3" /> Choose another branch
                </button>
              </div>
            )}

            {/* Step 3: Select Date */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg text-gray-900">Select Date for Dr. {selectedDoctor?.name}</h2>
                <input
                  type="date"
                  className="w-full border-2 rounded-xl p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none focus:border-teal-500"
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => handleDateSelect(e.target.value)}
                />
                <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:underline flex items-center gap-1 mt-4">
                  <ArrowLeft className="h-3 w-3" /> Choose another doctor
                </button>
              </div>
            )}

            {/* Step 4: Select Time */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg text-gray-900">Select Time - {date}</h2>
                <AvailableSlots 
                  slots={slots} 
                  selectedTime={time} 
                  onSelect={(t: string) => setTime(t)} 
                />
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:underline flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Change Date
                  </button>
                  {time && (
                    <button 
                      onClick={() => setStep(5)} 
                      className="ml-auto px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Continue
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Patient Info */}
            {step === 5 && !appointmentId && (
              <PatientInfoForm
                onSubmit={handleSubmit}
                submitting={submitting}
                onBack={() => setStep(4)}
              />
            )}
          </>
        )}

        {/* Confirmation Screen */}
        {appointmentId && (
          <div className="text-center py-8 space-y-5">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
            <p className="text-gray-500 text-sm">Your appointment has been booked successfully.</p>
            
            <div className="bg-gray-50 p-5 rounded-xl text-sm text-left space-y-3 mt-6 border">
              <div className="flex justify-between"><span className="text-gray-500">Branch:</span> <span className="font-medium">{selectedBranch?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Doctor:</span> <span className="font-medium">Dr. {selectedDoctor?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date:</span> <span className="font-medium">{date}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Time:</span> <span className="font-medium">{time}</span></div>
            </div>

            <a href={`/book/confirmation/${appointmentId}`} className="text-teal-600 text-sm hover:underline block mt-6 font-medium">
              View Full Details →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}