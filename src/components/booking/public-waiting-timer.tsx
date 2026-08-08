"use client"

import { useState, useEffect } from "react"
import { Clock, Hourglass } from "lucide-react"

export function PublicWaitingTimer({ dateStr, timeStr }: { dateStr: string; timeStr: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [status, setStatus] = useState<"upcoming" | "waiting">("upcoming")

  useEffect(() => {
    // نستخدم التاريخ والوقت اللي المريض اختاره عشان نتجنب أي مشاكل تحويل التوقيت من السيرفر
    const targetDate = new Date(`${dateStr}T${timeStr}:00`)

    const updateTimer = () => {
      const now = new Date()
      const diffMs = targetDate.getTime() - now.getTime()

      if (diffMs > 0) {
        setStatus("upcoming")
        const h = Math.floor(diffMs / (1000 * 60 * 60))
        const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diffMs % (1000 * 60)) / 1000)
        setTimeLeft({ hours: h, minutes: m, seconds: s })
      } else {
        setStatus("waiting")
        const elapsedMs = Math.abs(diffMs)
        const h = Math.floor(elapsedMs / (1000 * 60 * 60))
        const m = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((elapsedMs % (1000 * 60)) / 1000)
        setTimeLeft({ hours: h, minutes: m, seconds: s })
      }
    }

    updateTimer() // نشغله مرة واحدة فوراً عشان مايظهرش أصفار
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [dateStr, timeStr])

  const pad = (n: number) => n.toString().padStart(2, "0")

  return (
    <div className={`w-full max-w-xs p-5 rounded-2xl border text-center transition-colors duration-500 ${
      status === "upcoming" 
        ? "bg-emerald-50 border-emerald-200" 
        : "bg-amber-50 border-amber-200"
    }`}>
      <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${
        status === "upcoming" ? "bg-emerald-100" : "bg-amber-100"
      }`}>
        {status === "upcoming" 
          ? <Clock className="w-6 h-6 text-emerald-600" />
          : <Hourglass className="w-6 h-6 text-amber-600" />
        }
      </div>
      
      <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
        status === "upcoming" ? "text-emerald-700" : "text-amber-700"
      }`}>
        {status === "upcoming" ? "Starts In" : "Waiting Time"}
      </p>

      <div className={`flex items-center justify-center gap-1.5 font-mono text-2xl font-bold ${
        status === "upcoming" ? "text-emerald-900" : "text-amber-900"
      }`}>
        <span className="bg-white/60 px-2 py-1 rounded-lg">{pad(timeLeft.hours)}h</span>
        <span className="animate-pulse">:</span>
        <span className="bg-white/60 px-2 py-1 rounded-lg">{pad(timeLeft.minutes)}m</span>
        <span className="animate-pulse">:</span>
        <span className="bg-white/60 px-2 py-1 rounded-lg">{pad(timeLeft.seconds)}s</span>
      </div>

      <p className={`text-[11px] mt-3 leading-relaxed ${
        status === "upcoming" ? "text-emerald-600" : "text-amber-600"
      }`}>
        {status === "upcoming" 
          ? "Please make sure to arrive 5 minutes early." 
          : "The doctor will call you shortly. Please wait patiently."}
      </p>
    </div>
  )
}