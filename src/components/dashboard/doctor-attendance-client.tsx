"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  CalendarDays, CheckCircle2, XCircle, Clock, UserCheck, Search, Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"
import type { ActionResult } from "@/types"
import { checkInDoctor, checkOutDoctor, markDoctorAbsent } from "@/lib/actions/attendance"

interface DoctorAttendanceRecord {
  id: string
  doctorId: string
  doctorName: string
  specialty: string | null
  doctorImage: string | null
  branchName: string
  scheduledStart: string
  scheduledEnd: string
  checkInTime: string | null
  checkOutTime: string | null
  workingHours: string | null
  status: string
}

interface KPIs {
  totalDoctors: number
  presentCount: number
  absentCount: number
  notCheckedInCount: number
}

interface DoctorOption {
  value: string
  label: string
}

interface Props {
  tableData: DoctorAttendanceRecord[]
  branches: { id: string; name: string }[]
  doctors: DoctorOption[]
  selectedDate: string
  selectedBranch: string
  kpis: KPIs
}

const statusStyles: Record<string, string> = {
  "PRESENT": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  "ABSENT": "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  "CHECKED_OUT": "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
  "NOT_CHECKED_IN": "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
}

const statusLabels: Record<string, string> = {
  "PRESENT": "Present",
  "ABSENT": "Absent",
  "CHECKED_OUT": "Checked Out",
  "NOT_CHECKED_IN": "Not Checked In",
}

function formatTime(isoString: string | null): string {
  if (!isoString) return "—"
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  } catch {
    return "—"
  }
}

export function DoctorAttendanceClient({ tableData, branches, doctors, selectedDate, selectedBranch, kpis }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const canManage = session?.user && ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(session.user.role)
  const [isPending, startTransition] = useTransition()

  const currentDate = new Date()
  const isToday = selectedDate === currentDate.toISOString().split("T")[0]

  const currentBranch = selectedBranch || ""
  const currentSearch = searchParams.get("search") || ""

  const filteredData = tableData.filter(d => {
    if (currentBranch && d.branchName !== currentBranch) return false
    if (currentSearch && !d.doctorName.toLowerCase().includes(currentSearch.toLowerCase())) return false
    return true
  })

  // ✅ FIX 1-2: تهيئة result بقيمة افتراضية
  // ✅ FIX 3: تصحيح استدعاء toast.error ليتوافق مع sonner
  const handleAction = async (action: "checkIn" | "checkOut" | "absent", attendanceId: string, doctorId: string) => {
    startTransition(async () => {
      let result: ActionResult = { success: false }

      if (action === "checkIn") {
        result = await checkInDoctor(attendanceId, doctorId)
      } else if (action === "checkOut") {
        result = await checkOutDoctor(attendanceId)
      } else if (action === "absent") {
        result = await markDoctorAbsent(attendanceId)
      }

      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.error || "Something went wrong")
      }
    })
  }

  // ✅ FIX 4-5: استخدام URLSearchParams بدلاً من URL
  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/doctor-attendance?${params.toString()}`)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-[28px] font-bold text-foreground tracking-tight">
          Doctor Attendance
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor doctor attendance, check-ins, and daily working status.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#223247] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{kpis.totalDoctors}</p>
          <p className="text-xs text-muted-foreground">Total Doctors</p>
        </div>

        <div className="p-4 rounded-2xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#223247] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{kpis.presentCount}</p>
          <p className="text-xs text-muted-foreground">Present</p>
        </div>

        <div className="p-4 rounded-2xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#223247] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{kpis.absentCount}</p>
          <p className="text-xs text-muted-foreground">Absent</p>
        </div>

        <div className="p-4 rounded-2xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#223247] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{kpis.notCheckedInCount}</p>
          <p className="text-xs text-muted-foreground">Not Checked In</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-2xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#223247] shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={isToday ? "" : selectedDate}
            onChange={(e) => updateParam("date", e.target.value)}
            placeholder="Select date"
            className="h-10 w-full sm:w-48 rounded-lg border border-input px-3 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={currentBranch || ""}
            onValueChange={(value) => updateParam("branch", value)}
          >
            <option value="">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={currentSearch}
            onChange={(e) => updateParam("search", e.target.value)}
            placeholder="Search doctor..."
            className="h-10 w-full rounded-lg border border-input px-3 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {filteredData.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No attendance records for this date"
          description="No doctors found for the selected filters. Try changing the date or branch."
        />
      ) : (
        <div className="rounded-2xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#223247] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 dark:bg-muted/30">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Doctor</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Branch</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Scheduled</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Check In</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Check Out</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hours</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.map((record) => {
                  const showCheckIn = canManage && (record.status === "NOT_CHECKED_IN" || record.status === "CHECKED_OUT")
                  const showCheckOut = canManage && record.status === "PRESENT"
                  const showAbsent = canManage && (record.status === "NOT_CHECKED_IN" || record.status === "PRESENT")

                  return (
                    <tr key={record.doctorId} className="border-b border-border hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* ✅ FIX 6: معالجة null قبل تمريره لـ src */}
                          {record.doctorImage ? (
                            <img src={record.doctorImage!} alt="" className="h-8 w-8 rounded-full object-cover border-2 border-border" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {record.doctorName.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{record.doctorName}</p>
                            {record.specialty && (
                              <p className="text-xs text-muted-foreground truncate">{record.specialty}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{record.branchName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {record.scheduledStart && record.scheduledEnd ? `${record.scheduledStart} - ${record.scheduledEnd}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatTime(record.checkInTime)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatTime(record.checkOutTime)}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">{record.workingHours || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusStyles[record.status] || ""}`}>
                          {statusLabels[record.status] || record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {showCheckIn && (
                            <button
                              onClick={() => handleAction("checkIn", record.id, record.doctorId)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Check In
                            </button>
                          )}
                          {/* ✅ FIX 7: إضافة record.doctorId كمعامل ثالث */}
                          {showCheckOut && (
                            <button
                              onClick={() => handleAction("checkOut", record.id, record.doctorId)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Check Out
                            </button>
                          )}
                          {/* ✅ FIX 8: إضافة record.doctorId كمعامل ثالث */}
                          {showAbsent && (
                            <button
                              onClick={() => handleAction("absent", record.id, record.doctorId)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Absent
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}