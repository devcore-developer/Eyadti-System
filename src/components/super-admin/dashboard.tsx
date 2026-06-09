"use client"

import { useState, useEffect } from "react"
import { overrideSubscription, superAdminGenerateCodes, getPlansForAdmin } from "@/actions/super-admin"
import { Loader2, Copy, Check } from "lucide-react"

interface Plan { id: string; name: string }

const DURATION_OPTIONS = [
  { label: "10 Days (Trial)", value: 10 },
  { label: "1 Month (30 Days)", value: 30 },
  { label: "6 Months (180 Days)", value: 180 },
  { label: "1 Year (365 Days)", value: 365 },
];

export function SuperAdminDashboard({ subscribers }: { subscribers: any[] }) {
  const [plans, setPlans] = useState<Plan[]>([])
  
  // Code Gen State
  const [planId, setPlanId] = useState("")
  const [durationDays, setDurationDays] = useState(30)
  const [quantity, setQuantity] = useState(1)
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([])
  const [isPending, setIsPending] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    async function loadPlans() {
      const plansData = await getPlansForAdmin();
      setPlans(plansData || []);
      if (plansData && plansData.length > 0) setPlanId(plansData[0].id);
    }
    loadPlans();
  }, []);

  const handleAction = async (clinicId: string, action: "ACTIVE" | "EXPIRED" | "SUSPENDED", days?: number) => {
    setIsPending(clinicId)
    await overrideSubscription(clinicId, action, days)
    setIsPending(null)
    window.location.reload()
  }

  const handleGenerate = async () => {
    setIsPending("generating")
    setGeneratedCodes([])
    const result = await superAdminGenerateCodes({ planId, durationDays, quantity })
    if (result.success && result.codes) {
      setGeneratedCodes(result.codes)
    } else {
      alert(result.error || "Failed to generate codes")
    }
    setIsPending(null)
  }

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Super Admin Panel - Platform Control</h1>

      {/* ── منطقة توليد الأكواد ── */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700/50">
        <h2 className="text-xl font-bold mb-4">Generate Activation Codes</h2>
        <p className="text-sm text-muted-foreground mb-4">Select Plan, Duration, and Quantity. The generated code will dictate what the client gets upon signup.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Plan Select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Plan (Bundle)</label>
            <select 
              value={planId} 
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>

          {/* Duration Select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Duration</label>
            <select 
              value={durationDays} 
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Quantity (Max 100)</label>
            <input 
              type="number" 
              min={1} 
              max={100} 
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))} 
              className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button 
              onClick={handleGenerate} 
              disabled={isPending === "generating" || !planId} 
              className="w-full gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:-translate-y-0.5 transition-all disabled:opacity-50 flex justify-center items-center"
            >
              {isPending === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Generate Codes
            </button>
          </div>
        </div>

        {/* ── عرض الأكواد اللي اتولدت ── */}
        {generatedCodes.length > 0 && (
          <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl">
            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-3">
              ✅ Generated Codes (Send these to the client):
            </h3>
            <div className="space-y-2">
              {generatedCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="font-mono font-bold tracking-widest text-foreground text-md">{code}</span>
                  <button 
                    onClick={() => handleCopy(code, index)}
                    className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 transition flex items-center gap-1.5 font-semibold"
                  >
                    {copiedIndex === index ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedIndex === index ? "Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── جدول المشتركين ── */}
      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <h2 className="text-xl font-bold p-4 border-b border-slate-200 dark:border-slate-700">Subscribers ({subscribers.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-3 border-b text-xs text-muted-foreground">Clinic Name</th>
                <th className="p-3 border-b text-xs text-muted-foreground">Admin Email</th>
                <th className="p-3 border-b text-xs text-muted-foreground">Status</th>
                <th className="p-3 border-b text-xs text-muted-foreground">Ends At</th>
                <th className="p-3 border-b text-xs text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((clinic: any) => (
                <tr key={clinic.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  <td className="p-3 font-medium">{clinic.name}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400 text-sm">{clinic.users[0]?.email || "N/A"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      clinic.subscription?.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                      clinic.subscription?.status === "TRIAL" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : 
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {clinic.subscription?.status || "NO SUB"}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-500 dark:text-gray-400">
                    {clinic.subscription?.endDate ? new Date(clinic.subscription.endDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="p-3 space-x-2">
                    <button 
                      onClick={() => handleAction(clinic.id, "ACTIVE", 30)} 
                      disabled={isPending === clinic.id}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs hover:bg-emerald-700 disabled:opacity-50 font-medium"
                    >
                      Activate +30d
                    </button>
                    <button 
                      onClick={() => handleAction(clinic.id, "SUSPENDED")} 
                      disabled={isPending === clinic.id}
                      className="bg-red-600 text-white px-3 py-1.5 rounded text-xs hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}