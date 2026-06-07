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
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-10 w-10 mx-auto mb-2 text-gray-300" />
        <p>No available slots for this date</p>
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

  const SlotSection = ({ title, sectionSlots }: { title: string; sectionSlots: string[] }) => (
    sectionSlots.length > 0 ? (
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {sectionSlots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onSelect(slot)}
              className={`py-2 px-3 text-sm rounded-lg border transition-all ${
                selectedTime === slot
                  ? "bg-teal-600 text-white border-teal-600 shadow-md scale-95"
                  : "bg-white hover:border-teal-400 hover:bg-teal-50 text-gray-700"
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
    <div className="max-h-[300px] overflow-y-auto p-1">
      <SlotSection title="🌅 Morning" sectionSlots={morningSlots} />
      <SlotSection title="🌙 Afternoon / Evening" sectionSlots={afternoonSlots} />
    </div>
  )
}