"use client"

import { useState } from "react"
import { superAdminGenerateCodes } from "@/actions/super-admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Copy, Check } from "lucide-react"

interface Plan { id: string; name: string; }

interface GenerateCodeFormProps {
  plans: Plan[];
}

// تعريف بسيط للنتيجة (تأكد إن ActionResult في types/index.ts متضمن codes?: string[])
interface ActionResultWithCodes {
  success: boolean;
  error?: string;
  message?: string;
  codes?: string[];
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
  const [result, setResult] = useState<ActionResultWithCodes | null>(null) // ✅ State for storing full result
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setMessage(null)
    setResult(null)
    setCopied(false)

    const res = await superAdminGenerateCodes({
      planId,
      durationDays,
      quantity,
    });

    if (res?.success) {
      setMessage({ type: "success", text: res.message || "Codes generated!" })
      setResult(res)
    } else {
      setMessage({ type: "error", text: res?.error || "Failed to generate" })
    }
    setIsPending(false)
  }

  const handleCopy = () => {
    if (result?.codes) {
      navigator.clipboard.writeText(result.codes.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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

      {/* ✅ Display Generated Codes */}
      {result?.success && result?.codes && result.codes.length > 0 && (
        <div className="mt-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-4">
          <div className="flex justify-between items-center mb-3">
            <Label className="font-semibold text-foreground">Generated Codes ({result.codes.length})</Label>
            <Button 
              type="button" // type="button" to prevent form submit
              variant="outline" 
              size="sm" 
              onClick={handleCopy}
              className="text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" /> Copy All
                </>
              )}
            </Button>
          </div>
          <textarea
            readOnly
            className="w-full h-32 p-3 text-xs font-mono border-0 bg-transparent resize-none focus:outline-none text-slate-700 dark:text-slate-300"
            value={result.codes.join('\n')}
          />
        </div>
      )}

      <Button type="submit" disabled={isPending || !planId} className="gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white w-full md:w-auto">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Generate Codes
      </Button>
    </form>
  )
}