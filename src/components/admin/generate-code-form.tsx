"use client"

import { useState } from "react"
import { superAdminGenerateCodes } from "@/actions/super-admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Copy, Check } from "lucide-react"
import { TRIAL_DURATION_DAYS } from "@/lib/constants/features"

interface Plan { id: string; name: string; }

interface GenerateCodeFormProps {
  plans: Plan[];
}

interface ActionResultWithCodes {
  success: boolean;
  error?: string;
  message?: string;
  codes?: string[];
}

const DURATION_OPTIONS = [
  { label: `${TRIAL_DURATION_DAYS} Days (Trial)`, value: TRIAL_DURATION_DAYS },
  { label: "1 Month (30 Days)", value: 30 },
  { label: "6 Months (180 Days)", value: 180 },
  { label: "1 Year (365 Days)", value: 365 },
];

export function GenerateCodeForm({ plans }: GenerateCodeFormProps) {
  const [planId, setPlanId] = useState("")
  // FIX #31: Add type selection
  const [codeType, setCodeType] = useState<"SIGNUP" | "SUBSCRIPTION">("SUBSCRIPTION")
  const [durationDays, setDurationDays] = useState(30)
  const [quantity, setQuantity] = useState(10)
  // FIX #32: Add expiration date option
  const [expiresAt, setExpiresAt] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [result, setResult] = useState<ActionResultWithCodes | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setMessage(null)
    setResult(null)
    setCopied(false)

    const res = await superAdminGenerateCodes({
      planId,
      type: codeType,
      durationDays,
      quantity,
      expiresAt: expiresAt || null,
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
      <h3 className="text-lg font-bold text-foreground">Generate Activation Codes</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* FIX #31: Type Select */}
        <div className="space-y-2">
          <Label htmlFor="codeType">Code Type</Label>
          <select 
            id="codeType"
            value={codeType} 
            onChange={(e) => setCodeType(e.target.value as "SIGNUP" | "SUBSCRIPTION")}
            className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          >
            <option value="SUBSCRIPTION">Subscription Code</option>
            <option value="SIGNUP">Signup / Trial Code</option>
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

      {/* FIX #32: Expiration Date */}
      <div className="space-y-2">
        <Label htmlFor="expiresAt">Code Expiration Date (Optional)</Label>
        <Input 
          id="expiresAt"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">Leave empty for no expiration.</p>
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {result?.success && result?.codes && result.codes.length > 0 && (
        <div className="mt-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-4">
          <div className="flex justify-between items-center mb-3">
            <Label className="font-semibold text-foreground">Generated Codes ({result.codes.length})</Label>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={handleCopy}
              className="text-xs"
            >
              {copied ? (
                <><Check className="h-3 w-3 mr-1" /> Copied</>
              ) : (
                <><Copy className="h-3 w-3 mr-1" /> Copy All</>
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