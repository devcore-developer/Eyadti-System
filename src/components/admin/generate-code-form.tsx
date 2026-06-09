"use client"

import { useState } from "react"
import { superAdminGenerateCodes } from "@/actions/super-admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface Plan { id: string; name: string; }

interface GenerateCodeFormProps {
  plans: Plan[];
}

const DURATION_OPTIONS = [
  { label: "10 Days (Trial)", value: 10 },
  { label: "1 Month (30 Days)", value: 30 },
  { label: "6 Months (180 Days)", value: 180 },
  { label: "1 Year (365 Days)", value: 365 },
];

export function GenerateCodeForm({ plans }: GenerateCodeFormProps) {
  const [planId, setPlanId] = useState("")
  const [durationDays, setDurationDays] = useState(30)
  const [quantity, setQuantity] = useState(10)
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setMessage(null)

    const result = await superAdminGenerateCodes({
      planId,
      durationDays,
      quantity,
      type: "SUBSCRIPTION", // دايماً SUBSCRIPTION عشان الـ SIGNUP اتعملت في الـ Trial System
    });

    if (result?.success) {
      setMessage({ type: "success", text: result.message || "Codes generated!" })
    } else {
      setMessage({ type: "error", text: result?.error || "Failed to generate" })
    }
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-bold text-foreground">Generate Subscription Codes</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plan Select */}
        <div className="space-y-2">
          <Label htmlFor="plan">Target Plan</Label>
          <select 
            id="plan"
            value={planId} 
            onChange={(e) => setPlanId(e.target.value)}
            required
            className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          >
            <option value="" disabled>Select Plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </div>

        {/* Duration Select */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <select 
            id="duration"
            value={durationDays} 
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity (Max 100)</Label>
          <Input 
            id="quantity" 
            type="number" 
            min={1} 
            max={100} 
            value={quantity} 
            onChange={(e) => setQuantity(Number(e.target.value))} 
            required 
          />
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={isPending || !planId} className="gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Generate Codes
      </Button>
    </form>
  )
}