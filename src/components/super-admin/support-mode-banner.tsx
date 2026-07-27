"use client"

import { useTransition, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { exitSupportMode } from "@/lib/actions/super-admin"
import { ShieldAlert, XCircle, Clock, Activity, HardDrive, Users, Building2, AlertTriangle, CheckCircle2, FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface SupportModeBannerProps {
  clinicId: string
  clinicName: string
  ownerName?: string | null
  planName?: string | null
  branchCount?: number
  doctorCount?: number
  patientCount?: number
  storageUsed?: number
  lastActivity?: Date | null
}

export function SupportModeBanner({ 
  clinicId, clinicName, ownerName, planName, 
  branchCount = 0, doctorCount = 0, patientCount = 0, 
  storageUsed = 0, lastActivity 
}: SupportModeBannerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  // مؤقت زمن بيقيس الثواني
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleExit = () => {
    startTransition(async () => {
      await exitSupportMode()
      router.push('/super-admin')
      router.refresh()
    })
  }

  const handleToggleEdit = () => {
    if (!isEditMode) {
      const confirmed = window.confirm("⚠️ Enabling Edit Mode will log all changes you make. Continue?")
      if (confirmed) setIsEditMode(true)
    } else {
      setIsEditMode(false)
    }
  }

  // تحويل الثواني لشكل ساعات ودقائق
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="sticky top-0 z-[100] animate-slide-down">
      {/* Main Banner */}
      <div className="bg-gradient-to-r from-[#F4B860] to-[#F59E0B] text-white shadow-lg shadow-[#F4B860]/20">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold">Support Mode Active</p>
              <p className="text-xs text-white/80">
                Viewing: <span className="font-semibold underline">{clinicName}</span> • Owner: {ownerName || 'N/A'} • Plan: {planName || 'None'} • {branchCount} Branches • {doctorCount} Docs
              </p>
            </div>
            <p className="md:hidden text-sm font-bold">{clinicName}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Timer */}
            <div className="hidden sm:flex items-center gap-1.5 bg-white/20 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(elapsedTime)}
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
            >
              <Activity className="h-3.5 w-3.5 mr-1.5" /> Diagnostics
            </Button>
            
            <Button 
              size="sm" 
              variant={isEditMode ? "destructive" : "ghost"}
              className={cn(
                "h-8 text-xs border",
                isEditMode ? "bg-red-500/20 border-red-300 text-white hover:bg-red-500/30" : "bg-white/10 hover:bg-white/20 text-white border-white/20"
              )}
              onClick={handleToggleEdit}
            >
              {isEditMode ? "⚠️ Edit ON" : "Read Only"}
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs bg-white/20 hover:bg-white/30 text-white"
              onClick={() => router.push("/super-admin/clinics/" + clinicId)}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Admin View
            </Button>

            <Separator orientation="vertical" className="h-6 bg-white/30" />

            <button 
              onClick={handleExit} 
              disabled={isPending}
              className="bg-white/20 hover:bg-white/30 disabled:opacity-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors text-xs font-bold uppercase tracking-wide"
            >
              <XCircle className="h-3.5 w-3.5" />
              {isPending ? "Exiting..." : "Exit"}
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostics Drawer */}
      {showDiagnostics && (
        <div className="bg-background border-b border-border shadow-xl animate-slide-down">
          <div className="max-w-[1600px] mx-auto p-6">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#6B9CFF]" /> Client Diagnostics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DiagnosticCard icon={HardDrive} label="Storage Used" value={`${storageUsed} Files`} color="text-[#6B9CFF]" />
              <DiagnosticCard icon={Users} label="Total Patients" value={patientCount} color="text-[#5BC0BE]" />
              <DiagnosticCard icon={Building2} label="Branches" value={branchCount} color="text-[#A78BFA]" />
              <DiagnosticCard icon={FileText} label="Doctors" value={doctorCount} color="text-[#6BCB77]" />
              <DiagnosticCard icon={CheckCircle2} label="Last Activity" value={lastActivity ? formatDistanceToNow(new Date(lastActivity), { addSuffix: true }) : 'Never'} color="text-muted-foreground" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DiagnosticCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  return (
    <Card className="premium-card border-none p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted/50"><Icon className={cn("h-4 w-4", color)} /></div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("text-sm font-bold", color)}>{value}</p>
        </div>
      </div>
    </Card>
  )
}