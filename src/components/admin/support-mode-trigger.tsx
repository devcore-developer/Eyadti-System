"use client"

import { useState } from "react"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { impersonateClinic } from "@/lib/actions/admin"
import { useRouter } from "next/navigation"

interface SupportModeTriggerProps {
  clinicId: string
  clinicName: string
}

export function SupportModeTrigger({ clinicId, clinicName }: SupportModeTriggerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to enter SUPPORT MODE for ${clinicName}?\n\nThis action will be logged.`
    )

    if (!confirmed) return

    setIsLoading(true)
    try {
      const result = await impersonateClinic(clinicId)

      if (result?.success) {
        alert(`Support Mode Activated`)
        router.push(`/dashboard?support_mode=true&clinic_id=${clinicId}`)
      } else {
        alert("Error: " + result?.error)
      }
    } catch (error) {
      console.error(error)
      alert("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
      onClick={handleClick}
      disabled={isLoading}
    >
      <ShieldAlert className="mr-2 h-4 w-4" />
      {isLoading ? "Accessing..." : "Support Mode"}
    </Button>
  )
}