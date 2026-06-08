"use client"

import { AppointmentStatus } from "@prisma/client"
import { changeAppointmentStatus } from "@/actions/appointments"
import { useRouter } from "next/navigation"
import { User, Clock, Play, CheckCircle2 } from "lucide-react"

type WaitingAppointment = {
  id: string
  arrivedAt: Date | null
  status: AppointmentStatus
  patient: { fullName: string; phone: string }
  doctor: { name: string }
}

export function WaitingRoomClient({ appointments }: { appointments: WaitingAppointment[] }) {
  const router = useRouter()

  const handleAction = async (id: string, newStatus: AppointmentStatus) => {
    await changeAppointmentStatus(id, newStatus)
    router.refresh()
  }

  const getWaitTime = (arrivedAt: Date | null) => {
    if (!arrivedAt) return "N/A"
    const now = new Date()
    const arrived = new Date(arrivedAt)
    const diffMs = now.getTime() - arrived.getTime()
    const diffMins = Math.round(diffMs / 60000)
    
    if (diffMins < 1) return "Just arrived"
    if (diffMins < 60) return `${diffMins} min wait`
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m wait`
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border">
        <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600">No Patients Waiting</h2>
        <p className="text-sm text-gray-400 mt-1">The waiting room is empty right now.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {appointments.map((apt) => (
        <div 
          key={apt.id} 
          className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-all ${
            apt.status === AppointmentStatus.IN_PROGRESS ? "border-indigo-400 bg-indigo-50/30" : "border-gray-100"
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-gray-900">{apt.patient.fullName}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <User className="h-3 w-3" /> Dr. {apt.doctor.name}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
              apt.status === AppointmentStatus.ARRIVED ? "bg-teal-100 text-teal-700" : "bg-indigo-100 text-indigo-700"
            }`}>
              {apt.status === AppointmentStatus.ARRIVED ? "WAITING" : "IN ROOM"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{getWaitTime(apt.arrivedAt)}</span>
          </div>

          <div className="flex gap-2">
            {apt.status === AppointmentStatus.ARRIVED && (
              <button 
                onClick={() => handleAction(apt.id, AppointmentStatus.IN_PROGRESS)}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                <Play className="h-4 w-4" /> Start Consult.
              </button>
            )}
            
            {apt.status === AppointmentStatus.IN_PROGRESS && (
              <button 
                onClick={() => handleAction(apt.id, AppointmentStatus.COMPLETED)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4" /> Complete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}