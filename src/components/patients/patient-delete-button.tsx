// src/components/patients/patient-delete-button.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deletePatient } from "@/lib/actions/patients"

type Props = {
  patientId: string
  patientName?: string
}

export function PatientDeleteButton({ patientId, patientName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deletePatient(patientId)
      if (!result.success) {
        setError(result.error || "Failed to delete")
        setConfirming(false)
      } else {
        router.refresh()
      }
    })
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-red-600 hover:text-red-800"
      >
        Delete
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-red-600">
        Delete{patientName ? ` ${patientName}` : ""}?
      </span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
      >
        {isPending ? "..." : "Yes"}
      </button>
      <button
        type="button"
        onClick={() => {
          setConfirming(false)
          setError(null)
        }}
        disabled={isPending}
        className="rounded border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-50"
      >
        No
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}