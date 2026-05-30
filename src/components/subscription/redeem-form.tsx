"use client"

import { useState } from "react"
import { redeemActivationCode } from "@/actions/subscription"
import { useSession } from "next-auth/react"

export function RedeemForm() {
  const [code, setCode] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const { update } = useSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setMessage(null)

    const result = await redeemActivationCode(code)

    if (result?.success) {
      setMessage({ type: "success", text: "Subscription activated successfully! Updating session..." })
      
      // ✅ تحديث الـ JWT/Session فوراً (هيروح يجيب البيانات الجديدة من الداتابيز لوحده)
      await update()
      
      // ترجيعه للداشبورد بعد تحديث الـ Session بنجاح
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1500)
    } else {
      setMessage({ type: "error", text: result?.error || "Failed to activate" })
      setIsPending(false) // رجع الزرار يشتغل تاني لو في خطأ
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Enter Activation Code
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX"
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-center text-lg tracking-widest"
        />
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Activating..." : "Activate Subscription"}
      </button>
    </form>
  )
}