"use client"

import { useState, useEffect, useCallback } from "react"
import { getTodayAttendance, checkInDoctor, checkOutDoctor } from "@/lib/actions/attendance"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, LogIn, LogOut, Clock, MapPin, UserCheck, UserX } from "lucide-react"
import { showSuccess, showError } from "@/components/shared/feedback-toast"
import { cn } from "@/lib/utils"

interface DoctorAttendance {
  doctorId: string
  doctorName: string
  branchId: string | null
  branchName: string | null
  status: string
  checkInTime: string | null
  checkOutTime: string | null
  attendanceId: string | null
}

interface AttendancePanelProps {
  clinicId: string
}

export function AttendancePanel({ clinicId }: AttendancePanelProps) {
  const [doctors, setDoctors] = useState<DoctorAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const data = await getTodayAttendance(clinicId)
    setDoctors(data)
    setLoading(false)
  }, [clinicId])

  useEffect(() => { loadData() }, [loadData])

  // ═══════════════════════════════════════════════════════════
  // ✅ FIX: Reordered arguments to match (attendanceId, doctorId)
  // ═══════════════════════════════════════════════════════════
  const handleCheckIn = async (doctorId: string, attendanceId: string | null) => {
    setActionLoading(doctorId)
    const result = await checkInDoctor(attendanceId, doctorId)
    if (result.success) {
      showSuccess("Checked In", "Doctor has been marked as present.")
      loadData()
    } else {
      showError("Failed", result.error || "Could not check in doctor.")
    }
    setActionLoading(null)
  }

  const handleCheckOut = async (attendanceId: string, doctorId: string) => {
    setActionLoading(doctorId)
    const result = await checkOutDoctor(attendanceId)
    if (result.success) {
      showSuccess("Checked Out", "Doctor has been checked out.")
      loadData()
    } else {
      showError("Failed", result.error || "Could not check out doctor.")
    }
    setActionLoading(null)
  }

  const formatTime = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    ABSENT: { label: "Not Arrived", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800", icon: UserX },
    PRESENT: { label: "Present", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: UserCheck },
    LATE: { label: "Late", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", icon: Clock },
    FINISHED: { label: "Finished", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", icon: LogOut },
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#5BC0BE]" />
            <CardTitle className="text-base">Today&apos;s Doctor Attendance</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {doctors.filter(d => d.status === "PRESENT" || d.status === "LATE").length}/{doctors.length} Present
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {doctors.map((doc) => {
          const config = statusConfig[doc.status] || statusConfig.ABSENT
          const StatusIcon = config.icon

          return (
            <div
              key={doc.doctorId}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                config.bg
              )}
            >
              <StatusIcon className={cn("h-4 w-4 shrink-0", config.color)} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  Dr. {doc.doctorName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={cn("text-[10px] font-semibold", config.color, "border-current/20")}>
                    {config.label}
                  </Badge>
                  {doc.branchName && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5" />
                      {doc.branchName}
                    </span>
                  )}
                  {doc.checkInTime && (
                    <span className="text-[10px] text-muted-foreground">
                      In: {formatTime(doc.checkInTime)}
                    </span>
                  )}
                  {doc.checkOutTime && (
                    <span className="text-[10px] text-muted-foreground">
                      Out: {formatTime(doc.checkOutTime)}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {(doc.status === "ABSENT") && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1 bg-[#5BC0BE] hover:bg-[#5BC0BE]/90 text-white"
                    // ✅ FIX: Pass (doctorId, attendanceId)
                    onClick={() => handleCheckIn(doc.doctorId, doc.attendanceId)}
                    disabled={actionLoading === doc.doctorId}
                  >
                    {actionLoading === doc.doctorId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <LogIn className="h-3 w-3" />
                    )}
                    Check In
                  </Button>
                )}

                {(doc.status === "PRESENT" || doc.status === "LATE") && doc.attendanceId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1"
                    onClick={() => handleCheckOut(doc.attendanceId!, doc.doctorId)}
                    disabled={actionLoading === doc.doctorId}
                  >
                    {actionLoading === doc.doctorId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <LogOut className="h-3 w-3" />
                    )}
                    Check Out
                  </Button>
                )}

                {doc.status === "FINISHED" && (
                  <span className="text-[10px] text-muted-foreground font-medium">Done</span>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}