"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { markNoShowAppointments } from "@/lib/actions/payment-workflow"
import { Button } from "@/components/ui/button"
import { UserX, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Props = {
  clinicId: string
  count: number
}

export function MarkNoShowButton({ clinicId, count }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleMarkNoShow() {
    startTransition(async () => {
      const result = await markNoShowAppointments(clinicId)
      if (result.success) {
        toast.success(result.message || `Marked ${count} appointment(s) as missed`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to mark no-show appointments")
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkNoShow}
      disabled={isPending}
      className="gap-2 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
      Mark {count} Missed
    </Button>
  )
}