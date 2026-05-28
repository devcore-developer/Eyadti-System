"use client"

import { useState } from "react"
import { generateActivationCode } from "@/actions/admin"

export function GenerateCodeForm() {
  const [duration, setDuration] = useState(30)
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setMessage(null)

    const result = await generateActivationCode(duration)

    if (result?.success) {
      setMessage({ type: "success", text: result.message || "Code generated!" })
    } else {
      setMessage({ type: "error", text: result?.error || "Failed to generate" })
    }
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Duration (Days)
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
        >
          <option value={7}>7 Days (Trial)</option>
          <option value={30}>30 Days (1 Month)</option>
          <option value={90}>90 Days (3 Months)</option>
          <option value={365}>365 Days (1 Year)</option>
        </select>
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm font-mono ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Generating..." : "Generate New Code"}
      </button>
    </form>
  )
}