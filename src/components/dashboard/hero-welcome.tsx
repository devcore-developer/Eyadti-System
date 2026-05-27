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

      // تحديد التحية بناءً على وقت جهاز المستخدم
      if (hour >= 5 && hour < 12) {
        setGreeting("Good Morning")
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good Afternoon")
      } else if (hour >= 17 && hour < 21) {
        setGreeting("Good Evening")
      } else {
        setGreeting("Good Night")
      }

      // تحديد التاريخ بناءً على وقت جهاز المستخدم
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    }

    // تشغيل الدالة أول مرة
    updateTimeAndGreeting()
    
    // تحديث الوقت والتحية كل دقيقة (60000 ميلي ثانية)
    // عشان لو المستخدم سيب الصفحة مفتوحة وعدى الصبح، تتغير لوحدها
    const interval = setInterval(updateTimeAndGreeting, 60000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div 
      className="relative overflow-hidden rounded-[28px] p-8 md:p-10 text-white shadow-[0_20px_50px_rgba(107,156,255,.20)] min-h-[240px] flex flex-col justify-between"
      style={{ background: 'linear-gradient(135deg, #5BC0BE, #6B9CFF)' }}
    >
      {/* Decorative Glass Elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight drop-shadow-sm">
            {greeting}, {doctorName}
          </h1>
          
          <div className="flex items-center gap-2 mt-2 text-white/80">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium">{clinicName} • {branchName}</span>
          </div>

          <p className="mt-4 text-lg text-white/90 font-light">
            Today you have <span className="font-semibold text-white drop-shadow-sm">{appointmentsCount} appointments</span> and <span className="font-semibold text-white drop-shadow-sm">{pendingInvoices} pending invoices</span>.
          </p>
          
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/appointments/new" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold border border-white/20 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <CalendarDays className="h-4 w-4" /> New Appointment
            </Link>
            <Link href="/patients/new" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold border border-white/20 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <UserPlus className="h-4 w-4" /> New Patient
            </Link>
            <Link href="/invoices/new" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold border border-white/20 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <FileText className="h-4 w-4" /> Create Invoice
            </Link>
          </div>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-sm">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm font-medium">{date}</span>
          </div>
          <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl transition-all duration-200 border border-white/10 shadow-sm hover:-translate-y-0.5">
            <Bell className="h-4 w-4" />
            <span className="text-sm font-medium">3 New Notifications</span>
          </button>
        </div>
      </div>
    </div>
  )
}