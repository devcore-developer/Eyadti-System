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

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  return `${minutes}m`
}

export function WaitingTimer({ scheduledTime, checkedInAt, isEmergency }: Props) {
  const [display, setDisplay] = useState<TimerDisplay>({ text: "N/A", type: "arrived" })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    function calculate() {
      const now = new Date()
      
      // Emergency patients - show time since arrival
      if (isEmergency && checkedInAt) {
        const arrived = new Date(checkedInAt)
        const diffMs = now.getTime() - arrived.getTime()
        const diffMins = Math.round(diffMs / 60000)
        
        if (diffMins < 1) {
          setDisplay({ text: "Just arrived", type: "emergency" })
        } else {
          setDisplay({ text: `${formatDuration(diffMs)} wait`, type: "emergency" })
        }
        return
      }

      // No scheduled time - fall back to check-in time
      if (!scheduledTime) {
        if (checkedInAt) {
          const arrived = new Date(checkedInAt)
          const diffMs = now.getTime() - arrived.getTime()
          const diffMins = Math.round(diffMs / 60000)
          
          if (diffMins < 1) {
            setDisplay({ text: "Just arrived", type: "arrived" })
          } else {
            setDisplay({ text: `${formatDuration(diffMs)} wait`, type: "waiting" })
          }
        } else {
          setDisplay({ text: "N/A", type: "arrived" })
        }
        return
      }

      const scheduled = new Date(scheduledTime)
      const diffMs = now.getTime() - scheduled.getTime()

      if (diffMs < 0) {
        // BEFORE scheduled time - show countdown
        const absDiff = Math.abs(diffMs)
        setDisplay({ text: `Starts in ${formatDuration(absDiff)}`, type: "countdown" })
      } else {
        // AFTER scheduled time - show waiting time from scheduled time
        const diffMins = Math.round(diffMs / 60000)
        
        if (diffMins < 1) {
          setDisplay({ text: "Just now", type: "waiting" })
        } else {
          setDisplay({ text: `Waiting ${formatDuration(diffMs)}`, type: "waiting" })
        }
      }
    }

    // Calculate immediately
    calculate()

    // Update every 30 seconds to avoid excessive re-renders
    intervalRef.current = setInterval(calculate, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [scheduledTime, checkedInAt, isEmergency])

  // Determine styling based on type
  const colorClass = {
    countdown: "text-blue-600 dark:text-blue-400",
    waiting: display.text.includes("Waiting") && parseInt(display.text.replace(/\D/g, "")) > 30 
      ? "text-red-600 dark:text-red-400" 
      : "text-amber-600 dark:text-amber-400",
    arrived: "text-gray-500 dark:text-gray-400",
    emergency: "text-red-600 dark:text-red-400",
  }[display.type]

  return (
    <span className={`text-xs font-medium ${colorClass}`}>
      {display.text}
    </span>
  )
}