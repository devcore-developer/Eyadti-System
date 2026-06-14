"use client"

import { useState, useEffect } from "react"
import { CalendarDays, Bell, Building2, UserPlus, FileText } from "lucide-react"
import Link from "next/link"

interface HeroWelcomeProps {
  doctorName?: string
  clinicName?: string
  branchName?: string
  appointmentsCount?: number
  pendingInvoices?: number
}

export function HeroWelcome({ 
  doctorName = "Doctor", 
  clinicName = "Eyadti Clinic",
  branchName = "Main Branch",
  appointmentsCount = 0, 
  pendingInvoices = 0 
}: HeroWelcomeProps) {
  const [greeting, setGreeting] = useState("Hello")
  const [date, setDate] = useState("")

  useEffect(() => {
    const updateTimeAndGreeting = () => {
      const now = new Date()
      const hour = now.getHours()

      if (hour >= 5 && hour < 12) setGreeting("Good Morning")
      else if (hour >= 12 && hour < 17) setGreeting("Good Afternoon")
      else if (hour >= 17 && hour < 21) setGreeting("Good Evening")
      else setGreeting("Good Night")

      setDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    }

    updateTimeAndGreeting()
    const interval = setInterval(updateTimeAndGreeting, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div 
      className="relative overflow-hidden rounded-2xl md:rounded-[28px] p-5 sm:p-8 md:p-10 text-white shadow-[0_20px_50px_rgba(107,156,255,.20)] flex flex-col justify-between"
      style={{ background: 'linear-gradient(135deg, #5BC0BE, #6B9CFF)' }}
    >
      {/* Decorative Glass Elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight drop-shadow-sm truncate">
            {greeting}, {doctorName}
          </h1>
          
          <div className="flex items-center gap-2 mt-2 text-white/80">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium truncate">{clinicName} • {branchName}</span>
          </div>

          <p className="mt-4 text-base sm:text-lg text-white/90 font-light">
            Today you have <span className="font-semibold text-white drop-shadow-sm">{appointmentsCount} appointments</span> and <span className="font-semibold text-white drop-shadow-sm">{pendingInvoices} pending invoices</span>.
          </p>
          
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-6">
            <Link href="/appointments/new" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold border border-white/20 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <CalendarDays className="h-4 w-4" /> New Appointment
            </Link>
            <Link href="/patients/new" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold border border-white/20 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <UserPlus className="h-4 w-4" /> New Patient
            </Link>
            <Link href="/invoices/new" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold border border-white/20 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <FileText className="h-4 w-4" /> Create Invoice
            </Link>
          </div>
        </div>
        
        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/20 shadow-sm flex-1 md:flex-none justify-center">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">{date}</span>
          </div>
          
          {/* ✨ جعل كارت الإشعارات قابل للنقر وموجه لصفحة الإشعارات */}
          <Link 
            href="/notifications" 
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 border border-white/10 shadow-sm hover:-translate-y-0.5 flex-1 md:flex-none justify-center cursor-pointer active:scale-95"
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">3 New Notifications</span>
          </Link>
        </div>
      </div>
    </div>
  )
}