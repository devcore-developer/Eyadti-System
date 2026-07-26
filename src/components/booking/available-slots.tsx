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
      <div className="text-center py-14 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Clock className="w-7 h-7 text-slate-300" />
        </div>
        <p className="font-semibold text-slate-500">No slots available</p>
        <p className="text-xs text-slate-400 mt-1">Try selecting a different date</p>
      </div>
    )
  }

  const morningSlots = slots.filter((s) => parseInt(s.split(":")[0]) < 12)
  const afternoonSlots = slots.filter((s) => parseInt(s.split(":")[0]) >= 12)

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`
  }

  const SlotSection = ({ title, sectionSlots, emoji }: { title: string; sectionSlots: string[]; emoji: string }) =>
    sectionSlots.length > 0 ? (
      <div className="mb-6 last:mb-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
          <span>{emoji}</span> {title}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {sectionSlots.map((slot) => {
            const isSelected = selectedTime === slot
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onSelect(slot)}
                className={`py-3.5 px-2 text-sm font-semibold rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? "text-white border-transparent shadow-lg shadow-blue-500/25 scale-[0.97]"
                    : "bg-white border-gray-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 hover:shadow-sm hover:scale-[1.03]"
                }`}
                style={isSelected ? { background: "linear-gradient(135deg, #3B82F6, #06B6D4)" } : undefined}
              >
                {formatTime(slot)}
              </button>
            )
          })}
        </div>
      </div>
    ) : null

  return (
    <div className="pb-2">
      <SlotSection title="Morning" sectionSlots={morningSlots} emoji="🌅" />
      <SlotSection title="Afternoon" sectionSlots={afternoonSlots} emoji="🌤" />
    </div>
  )
}