"use client"

import { useState, useTransition } from "react"
import { redeemSubscriptionCode } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface RedeemFormProps {
  clinicId: string
}

export function RedeemForm({ clinicId }: RedeemFormProps) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!code.trim()) {
      setError("Please enter a valid code")
      return
    }

    startTransition(async () => {
      const result = await redeemSubscriptionCode(clinicId, code.trim())
      if (result.success) {
        setSuccess(true)
        setCode("")
        // تحديث الصفحة لعرض بيانات الاشتراك الجديدة
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setError(result.error || "Failed to redeem code")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-start w-full max-w-lg">
      <div className="w-full space-y-1">
        <Input 
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX"
          disabled={isPending}
          className="font-semibold tracking-widest text-center h-11 border-slate-300 dark:border-slate-600"
        />
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3" /> {error}
          </p>
        )}
        {success && (
          <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
            <CheckCircle2 className="h-3 w-3" /> Code redeemed successfully! Refreshing...
          </p>
        )}
      </div>
      <Button 
        type="submit" 
        disabled={isPending || success} 
        className="gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white h-11 shrink-0"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Activating...
          </>
        ) : (
          "Activate"
        )}
      </Button>
    </form>
  )
}