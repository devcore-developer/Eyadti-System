"use client"

import { useState, useEffect, useRef } from "react"

type TimerDisplay = {
  text: string
  type: "countdown" | "waiting" | "arrived" | "emergency"
}

type Props = {
  scheduledTime: Date | string | null
  checkedInAt: Date | string | null
  isEmergency?: boolean
}

function formatHHMMSS(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function WaitingTimer({ scheduledTime, checkedInAt, isEmergency }: Props) {
  const [display, setDisplay] = useState<TimerDisplay>({ text: "N/A", type: "arrived" })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    function calculate() {
      const now = new Date()

      // ── Emergency patients: time since arrival ──
      if (isEmergency && checkedInAt) {
        const arrived = new Date(checkedInAt)
        const diffMs = now.getTime() - arrived.getTime()
        const diffMins = Math.round(diffMs / 60000)

        if (diffMins < 1) {
          setDisplay({ text: "Just arrived", type: "emergency" })
        } else {
          setDisplay({ text: `${formatHHMMSS(diffMs)} wait`, type: "emergency" })
        }
        return
      }

      // ── No scheduled time: fallback to check-in time ──
      if (!scheduledTime) {
        if (checkedInAt) {
          const arrived = new Date(checkedInAt)
          const diffMs = now.getTime() - arrived.getTime()
          const diffMins = Math.round(diffMs / 60000)

          if (diffMins < 1) {
            setDisplay({ text: "Just arrived", type: "arrived" })
          } else {
            setDisplay({ text: `${formatHHMMSS(diffMs)} wait`, type: "waiting" })
          }
        } else {
          setDisplay({ text: "N/A", type: "arrived" })
        }
        return
      }

      // ── Scheduled appointment: countdown or elapsed ──
      const scheduled = new Date(scheduledTime)
      const diffMs = now.getTime() - scheduled.getTime()

      if (diffMs < 0) {
        // FUTURE: appointment hasn't started yet
        setDisplay({ text: `Starts in ${formatHHMMSS(diffMs)}`, type: "countdown" })
      } else {
        // PAST/DUE: appointment time reached or passed
        setDisplay({ text: `Waiting for ${formatHHMMSS(diffMs)}`, type: "waiting" })
      }
    }

    // Calculate immediately
    calculate()

    // Update every second for a live timer
    intervalRef.current = setInterval(calculate, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [scheduledTime, checkedInAt, isEmergency])

  // ── Color logic ──
  const colorClass = {
    countdown: "text-blue-600 dark:text-blue-400",
    waiting: (() => {
      // Parse HH:MM:SS from display to determine if overdue > 30 min
      const match = display.text.match(/(\d{2}):(\d{2}):(\d{2})/)
      if (match) {
        const totalSeconds = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3])
        if (totalSeconds > 30 * 60) return "text-red-600 dark:text-red-400"
      }
      return "text-amber-600 dark:text-amber-400"
    })(),
    arrived: "text-gray-500 dark:text-gray-400",
    emergency: "text-red-600 dark:text-red-400",
  }[display.type]

  return (
    <span className={`text-xs font-medium tabular-nums ${colorClass}`}>
      {display.text}
    </span>
  )
}