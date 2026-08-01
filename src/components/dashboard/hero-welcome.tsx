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
  monthlyRevenue?: number
}

export function HeroWelcome({ 
  doctorName = "Doctor", 
  clinicName = "Nexora Clinic",
  branchName = "Main Branch",
  appointmentsCount = 0, 
  pendingInvoices = 0,
  monthlyRevenue = 0
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

      setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
    }

    updateTimeAndGreeting()
    const interval = setInterval(updateTimeAndGreeting, 60000)
    return () => clearInterval(interval)
  }, [])

  const formatAmount = (n: number) => n.toLocaleString('en-US')

  return (
    <div 
      className="relative overflow-hidden rounded-[24px] px-6 py-6 sm:px-8 sm:py-7 md:px-10 md:py-8 text-white"
      style={{ 
        background: 'linear-gradient(135deg, #2B9E99 0%, #5BC0BE 35%, #6B9CFF 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 4px 24px rgba(107,156,255,0.15), 0 12px 48px rgba(91,192,190,0.10)'
      }}
    >
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-white/[0.04] rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1 min-w-0">
          {/* Greeting */}
          <h1 className="text-xl sm:text-2xl md:text-[1.75rem] font-bold tracking-[-0.02em] leading-tight">
            {greeting}, {doctorName}
          </h1>
          
          {/* Clinic */}
          <div className="flex items-center gap-2 mt-1.5 text-white/60">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[13px] font-medium truncate">{clinicName}{branchName ? ` · ${branchName}` : ""}</span>
          </div>

          {/* Dynamic Summary */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight">
                {appointmentsCount}
              </span>
              <span className="text-[13px] text-white/60 font-medium">today</span>
            </div>
            {monthlyRevenue > 0 && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight">
                  {formatAmount(monthlyRevenue)}
                </span>
                <span className="text-[13px] text-white/60 font-medium">this month</span>
              </div>
            )}
            {pendingInvoices > 0 && (
              <div className="flex items-center gap-1.5 bg-white/[0.08] backdrop-blur-sm px-2.5 py-1 rounded-lg">
                <span className="text-[13px] font-semibold tabular-nums">{pendingInvoices}</span>
                <span className="text-[11px] text-white/50">pending</span>
              </div>
            )}
          </div>
          
          {/* CTAs */}
          <div className="flex flex-wrap gap-2 mt-5">
            <Link href="/appointments/new" className="inline-flex items-center gap-1.5 bg-white/[0.12] hover:bg-white/[0.18] backdrop-blur-sm px-3.5 py-2 rounded-lg transition-all duration-150 text-[13px] font-medium border border-white/[0.1] hover:-translate-y-px active:translate-y-0">
              <CalendarDays className="h-3.5 w-3.5" /> New Appointment
            </Link>
            <Link href="/patients/new" className="inline-flex items-center gap-1.5 bg-white/[0.12] hover:bg-white/[0.18] backdrop-blur-sm px-3.5 py-2 rounded-lg transition-all duration-150 text-[13px] font-medium border border-white/[0.1] hover:-translate-y-px active:translate-y-0">
              <UserPlus className="h-3.5 w-3.5" /> New Patient
            </Link>
            <Link href="/invoices/new" className="inline-flex items-center gap-1.5 bg-white/[0.12] hover:bg-white/[0.18] backdrop-blur-sm px-3.5 py-2 rounded-lg transition-all duration-150 text-[13px] font-medium border border-white/[0.1] hover:-translate-y-px active:translate-y-0">
              <FileText className="h-3.5 w-3.5" /> Create Invoice
            </Link>
          </div>
        </div>
        
        {/* Date Badge */}
        <div className="flex items-center gap-2 bg-white/[0.1] backdrop-blur-sm px-3 py-2.5 rounded-lg border border-white/[0.08] shrink-0 self-start">
          <CalendarDays className="h-3.5 w-3.5 text-white/50" />
          <span className="text-[12px] font-medium text-white/70 truncate">{date}</span>
        </div>
      </div>
    </div>
  )
}