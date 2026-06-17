"use client"

import { Clock } from "lucide-react"

interface AvailableSlotsProps {
  slots: string[]
  selectedTime: string
  onSelect: (time: string) => void
}

export function AvailableSlots({ slots, selectedTime, onSelect }: AvailableSlotsProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 font-medium">No slots available</p>
        <p className="text-xs text-gray-400 mt-1">Try selecting a different date</p>
      </div>
    )
  }

  const morningSlots = slots.filter(s => parseInt(s.split(":")[0]) < 12)
  const afternoonSlots = slots.filter(s => parseInt(s.split(":")[0]) >= 12)

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`
  }

  const SlotSection = ({ title, sectionSlots, icon }: { title: string; sectionSlots: string[]; icon: string }) => (
    sectionSlots.length > 0 ? (
      <div className="mb-6 last:mb-0">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
          <span>{icon}</span> {title}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {sectionSlots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onSelect(slot)}
              className={`py-3 px-2 text-sm font-semibold rounded-xl border transition-all duration-200 relative overflow-hidden group ${
                selectedTime === slot
                  ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/30 scale-95"
                  : "bg-white border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 hover:shadow-sm"
              }`}
            >
              {formatTime(slot)}
            </button>
          ))}
        </div>
      </div>
    ) : null
  )

  return (
    <div className="pb-4">
      <SlotSection title="Morning" sectionSlots={morningSlots} icon="🌅" />
      <SlotSection title="Afternoon / Evening" sectionSlots={afternoonSlots} icon="🌙" />
    </div>
  )
}