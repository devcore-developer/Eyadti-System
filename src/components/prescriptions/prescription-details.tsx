"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deletePrescription } from "@/lib/actions/prescriptions"
import { Button } from "@/components/ui/button"
import { Pill, Printer, Trash2, Pencil, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type PrescriptionFull = {
  id: string
  patientId: string
  doctorId: string
  createdAt: Date | string
  patient: { id: string; fullName: string; phone: string | null }
  doctor: { id: string; name: string }
  items: { id: string; medicationName: string; dosage: string; frequency: string; duration: string; instructions: string | null }[]
}

type Props = {
  prescription: PrescriptionFull
  role: string
  userId: string
}

export function PrescriptionDetails({ prescription, role, userId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const canModify = role === "ADMIN" || (role === "DOCTOR" && prescription.doctorId === userId)

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePrescription(prescription.id)
      if (result.success) {
        toast.success("Prescription deleted")
        router.push(`/patients/${prescription.patientId}/prescriptions`)
      } else {
        toast.error(result.error || "Failed to delete")
      }
    })
  }

  function formatDate(date: Date | string): string {
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return "—"
      return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(d)
    } catch { return "—" }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prescription</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(prescription.createdAt)} • Dr. {prescription.doctor.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/patients/${prescription.patientId}/prescriptions/${prescription.id}/print`} target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </Link>
          {canModify && (
            <>
              <Link href={`/patients/${prescription.patientId}/prescriptions/${prescription.id}/edit`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending} className="gap-2">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Pill className="h-5 w-5 text-blue-500" /> Medications
        </h2>
        <div className="divide-y divide-border/50">
          {prescription.items.map((item, index) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{index + 1}. {item.medicationName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.dosage} • {item.frequency} • {item.duration}
                  </p>
                </div>
              </div>
              {item.instructions && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-2 py-1 inline-block">
                  ⚠ {item.instructions}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}