"use client"

import { useState, useEffect } from "react"
import { getAvailableTimeSlots, createBooking, getBranches, getDoctorsByBranch, getAvailableDoctors } from "@/lib/actions/booking"
import { AvailableSlots } from "./available-slots"
import { PatientInfoForm } from "./patient-info-form"
import { Loader2, Calendar, Clock, User, CheckCircle2, MapPin, Phone, ArrowRight, ChevronLeft, Building2, Sparkles, Stethoscope, Award } from "lucide-react"

// Updated Type to include new fields
type Doctor = { 
  id: string; 
  name: string; 
  image?: string | null; 
  specialty?: string | null; 
  degree?: string | null;
  workingDays: string[]; 
  allBranchAccess?: boolean 
}

type Branch = { id: string; name: string; code: string; city: string | null }
type Clinic = { name: string; logoUrl?: string | null; phone?: string | null; address?: string | null; email?: string | null }

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
    async function loadInitialData() {
      setLoading(true)
      setError("")
      try {
        const data = await getBranches(clinicId)
        setBranches(data || [])
        
        if (data && data.length === 1) {
          // لو فيه فرع واحد بس، اختاره تلقائي
          handleBranchSelect(data[0])
        } else if (!data || data.length === 0) {
          // ✨ التعديل هنا: لو مفيش فروع خالص، اجيب كل أطباء العيادة وتجاهل خطوة الفرع
          const allDoctors = await getAvailableDoctors(clinicId)
          setDoctors(allDoctors || [])
          if (!allDoctors || allDoctors.length === 0) {
            setError("No doctors available for booking at the moment.")
          } else {
            setStep(2) // أنقله مباشرة لخطوة اختيار الدكتور
          }
        }
      } catch (err) {
        setError("Failed to load clinic data")
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [clinicId])

  const handleBranchSelect = async (branch: Branch) => {
    setSelectedBranch(branch)
    setLoading(true)
    setError("")
    try {
      const data = await getDoctorsByBranch(clinicId, branch.id)
      setDoctors(data || [])
      if (!data || data.length === 0) setError("No doctors available at this branch")
      else setStep(2)
    } catch (err) {
      console.error(err)
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
      else setStep(4)
    } catch (err) {
      setError("Failed to load slots")
    } finally {
      setLoading(false)
    }
  }

  const handleTimeSelect = (selectedTime: string) => {
    setTime(selectedTime)
    setStep(5)
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
        setStep(6)
      } else {
        setError(result.error || "Booking failed")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden min-h-[600px] flex flex-col relative transition-all duration-500">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 pb-12 rounded-b-[2.5rem] shadow-lg text-white relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
            {clinic.logoUrl ? (
              <img src={clinic.logoUrl} alt={clinic.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <Sparkles className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{clinic.name}</h1>
            <div className="flex items-center gap-1 text-teal-100 text-xs mt-0.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[200px]">{clinic.address || "Online Clinic"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 flex-1 flex flex-col relative z-20 pb-6">
        <div className="flex justify-between mb-6 px-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full mx-1 transition-all duration-300 ${
              step > i ? "bg-teal-500" : step === i ? "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" : "bg-gray-200"
            }`} />
          ))}
        </div>

        {error && (
          <div className="bg-red-50/90 backdrop-blur text-red-600 text-sm p-3 rounded-xl mb-4 border border-red-100 animate-pulse flex items-center gap-2">
            <span className="font-medium">⚠️ {error}</span>
          </div>
        )}

        {loading && step !== 1 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col justify-center items-center rounded-3xl">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-2" />
            <p className="text-sm font-medium text-gray-600 animate-pulse">Finding availability...</p>
          </div>
        )}

        {/* Step 1: Branch Selection (يظهر لو فيه فروع بس) */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-teal-700" />
              <h2 className="font-bold text-gray-800 text-lg">Select Branch</h2>
            </div>
            <div className="space-y-3">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleBranchSelect(branch)}
                  className="w-full group flex items-center justify-between p-4 bg-white border-2 border-gray-100 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10 rounded-2xl transition-all duration-200 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center text-teal-700 transition-colors">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{branch.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{branch.city}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Doctor Selection */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
             {/* ✨ التعديل هنا: لو فيه فروع يكتب "Change Branch"، لو مفيش يكتب "Back" */}
             <button onClick={() => setStep(1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 transition-colors">
              <ChevronLeft className="w-4 h-4" /> {branches.length > 0 ? "Change Branch" : "Back"}
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="w-5 h-5 text-teal-700" />
              <h2 className="font-bold text-gray-800 text-xl">Our Specialists</h2>
            </div>

            <div className="space-y-4">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => handleDoctorSelect(doctor)}
                  className="w-full group flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-teal-400 hover:shadow-xl hover:shadow-teal-500/10 rounded-2xl transition-all duration-300 text-left relative overflow-hidden"
                >
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 overflow-hidden border-2 border-white shadow-md">
                      {doctor.image ? (
                        <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8" />
                      )}
                    </div>
                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" title="Available" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-teal-700 transition-colors">
                      Dr. {doctor.name}
                    </h3>
                    
                    <div className="mt-1.5 space-y-1">
                      {doctor.specialty && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 tracking-wide">
                          {doctor.specialty}
                        </span>
                      )}
                      
                      {doctor.degree && (
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {doctor.degree}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {doctor.workingDays.slice(0, 3).map((day) => (
                        <span key={day} className="text-[10px] font-semibold px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md border border-gray-200">
                          {day}
                        </span>
                      ))}
                      {doctor.workingDays.length > 3 && <span className="text-[10px] text-gray-400">+{doctor.workingDays.length - 3}</span>}
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Date Selection */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
             <button onClick={() => setStep(2)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Doctors
            </button>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-teal-700" />
              <h2 className="font-bold text-gray-800 text-lg">Select Date</h2>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
               <label className="block text-sm font-medium text-gray-700 mb-2">When would you like to visit?</label>
               <input
                  type="date"
                  className="w-full text-lg font-semibold text-center p-3 border-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-teal-900"
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => handleDateSelect(e.target.value)}
                />
            </div>
          </div>
        )}

        {/* Step 4: Time Selection */}
        {step === 4 && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4 h-full flex flex-col">
             <button onClick={() => setStep(3)} className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Change Date
            </button>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-700" />
                <h2 className="font-bold text-gray-800 text-lg">Available Times</h2>
              </div>
              <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">{date}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto -mx-2 px-2 pb-4 custom-scrollbar">
              <AvailableSlots 
                slots={slots} 
                selectedTime={time} 
                onSelect={handleTimeSelect} 
              />
            </div>
          </div>
        )}

        {/* Step 5: Patient Details */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => setStep(4)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Times
            </button>
            <PatientInfoForm
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>
        )}

        {/* Step 6: Success */}
        {step === 6 && appointmentId && (
          <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95 duration-500 text-center space-y-6 h-full">
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-green-600 stroke-[2]" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping opacity-75" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Booking Confirmed!</h2>
              <p className="text-gray-500">We have sent a confirmation to your phone.</p>
            </div>

            <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-2xl border border-gray-200 text-left space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clinic</span>
                <span className="font-medium text-gray-900">{clinic.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Doctor</span>
                <span className="font-semibold text-gray-900">Dr. {selectedDoctor?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Date</span>
                <span className="font-semibold text-gray-900">{date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Time</span>
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{time}</span>
              </div>
            </div>

            <a 
              href={`/book/confirmation/${appointmentId}`} 
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium shadow-lg shadow-gray-200/50 flex items-center justify-center gap-2 group"
            >
              View Appointment Details
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        )}

      </div>
    </div>
  )
}