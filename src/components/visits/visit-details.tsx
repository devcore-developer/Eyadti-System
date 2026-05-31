"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteVisit } from "@/lib/actions/visits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Stethoscope, HeartPulse, ClipboardList, CalendarDays, FileText, Trash2, Pencil, Pill, Printer } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type PrescriptionData = {
  id: string
  items: { id: string; medicationName: string; dosage: string; frequency: string; duration: string; instructions: string | null }[]
}

type VisitFull = {
  id: string
  visitDate: Date
  notes: string | null
  patient: { id: string; fullName: string }
  doctor: { id: string; name: string }
  complaints: { id: string; complaint: string }[]
  diagnoses: { id: string; diagnosis: string }[]
  treatmentPlans: { id: string; treatment: string }[]
  prescription: PrescriptionData | null  // ← هنا بقى optional
}

type Props = {
  visit: VisitFull
  role: string
  userId: string
  patientId: string
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date))
}

export function VisitDetails({ visit, role, userId, patientId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const canModify = role === "SUPER_ADMIN" || role === "ADMIN" || (role === "DOCTOR" && visit.doctor.id === userId)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteVisit(visit.id)
      if (!result.success) {
        toast.error(result.error || "Failed to delete")
      } else {
        toast.success("Visit deleted successfully")
        router.push(`/patients/${visit.patient.id}/visits`)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medical Visit</h1>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {formatDate(visit.visitDate)}</span>
            <span className="flex items-center gap-1"><Stethoscope className="h-4 w-4" /> Dr. {visit.doctor.name}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {!visit.prescription && canModify && (
            <Link href={`/patients/${patientId}/prescriptions/new?visitId=${visit.id}`}>
              <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 transition-all" size="sm">
                <Pill className="h-3.5 w-3.5" /> Create Prescription
              </Button>
            </Link>
          )}
          {visit.prescription && (
            <Link href={`/patients/${patientId}/prescriptions/${visit.prescription.id}/print`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="h-3.5 w-3.5" /> Print Rx
              </Button>
            </Link>
          )}
          {canModify && (
            <Link href={`/patients/${visit.patient.id}/visits/${visit.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </Link>
          )}
          {canModify && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="gap-2"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" /> {isPending ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Complaints */}
        <Card className="glass-card border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-rose-600 dark:text-rose-400">
              <HeartPulse className="h-5 w-5" /> Chief Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {visit.complaints.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span>{c.complaint}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Diagnoses */}
        <Card className="glass-card border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-teal-600 dark:text-teal-400">
              <Stethoscope className="h-5 w-5" /> Diagnoses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {visit.diagnoses.map((d) => (
                <li key={d.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
                  <span>{d.diagnosis}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Treatment Plans */}
        <Card className="glass-card border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-600 dark:text-amber-400">
              <ClipboardList className="h-5 w-5" /> Treatment Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {visit.treatmentPlans.map((t) => (
                <li key={t.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>{t.treatment}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Prescription */}
      {visit.prescription && (
        <Card className="glass-card border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-blue-600 dark:text-blue-400">
              <Pill className="h-5 w-5" /> Prescription
            </CardTitle>
            <Link
              href={`/patients/${patientId}/prescriptions/${visit.prescription.id}`}
              className="text-xs font-semibold text-primary hover:text-primary/80"
            >
              View & Print →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/50">
              {visit.prescription.items.map((item: any, index: number) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-medium text-foreground">{index + 1}. {item.medicationName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.dosage} • {item.frequency} • {item.duration}
                  </p>
                  {item.instructions && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      ⚠ {item.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {visit.notes && (
        <Card className="glass-card border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <FileText className="h-5 w-5 text-slate-500" /> Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{visit.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}