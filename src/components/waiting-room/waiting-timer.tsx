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

function formatMinutes(ms: number): string {
  const totalMinutes = Math.round(Math.abs(ms) / 60000)
  if (totalMinutes === 0) return "0 minutes"
  if (totalMinutes === 1) return "1 minute"
  return `${totalMinutes} minutes`
}

export function WaitingTimer({ scheduledTime, checkedInAt, isEmergency }: Props) {
  const [display, setDisplay] = useState<TimerDisplay>({ text: "N/A", type: "arrived" })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    function calculate() {
      const now = new Date()

      // ── Emergency: time since arrival ──
      if (isEmergency && checkedInAt) {
        const arrived = new Date(checkedInAt)
        const diffMs = now.getTime() - arrived.getTime()
        if (diffMs < 60000) {
          setDisplay({ text: "Just arrived", type: "emergency" })
        } else {
          setDisplay({ text: `Waiting for ${formatMinutes(diffMs)}`, type: "emergency" })
        }
        return
      }

      // ── No scheduled time: fallback to check-in time ──
      if (!scheduledTime) {
        if (checkedInAt) {
          const arrived = new Date(checkedInAt)
          const diffMs = now.getTime() - arrived.getTime()
          if (diffMs < 60000) {
            setDisplay({ text: "Just arrived", type: "arrived" })
          } else {
            setDisplay({ text: `Waiting for ${formatMinutes(diffMs)}`, type: "waiting" })
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
        setDisplay({ text: `Starts in ${formatMinutes(diffMs)}`, type: "countdown" })
      } else {
        // PAST/DUE: appointment time reached or passed
        setDisplay({ text: `Waiting for ${formatMinutes(diffMs)}`, type: "waiting" })
      }
    }

    calculate()
    intervalRef.current = setInterval(calculate, 1000)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [scheduledTime, checkedInAt, isEmergency])

  const colorClass = {
    countdown: "text-blue-600 dark:text-blue-400",
    waiting: (() => {
      const match = display.text.match(/(\d+)\s+minute/)
      if (match) {
        const mins = parseInt(match[1])
        if (mins > 30) return "text-red-600 dark:text-red-400"
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