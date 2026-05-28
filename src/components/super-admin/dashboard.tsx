"use client"

import { useState } from "react"
import { overrideSubscription, superAdminGenerateCode } from "@/actions/super-admin"

export function SuperAdminDashboard({ subscribers }: { subscribers: any[] }) {
  const [isPending, setIsPending] = useState<string | null>(null)
  const [newCode, setNewCode] = useState<string | null>(null)

  const handleAction = async (clinicId: string, action: "ACTIVE" | "EXPIRED" | "SUSPENDED", days?: number) => {
    setIsPending(clinicId)
    await overrideSubscription(clinicId, action, days)
    setIsPending(null)
    window.location.reload() // عشان يتحدث الجدول
  }

  const handleGenerateCode = async (days: number) => {
    setIsPending("code")
    const res = await superAdminGenerateCode(days)
    if (res.success) {
      // ✅ التعديل هنا عشان ن حل مشكلة الـ TypeScript
      setNewCode(res.message || "Code generated successfully!") 
    }
    setIsPending(null)
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Super Admin Panel - Platform Control</h1>

      {/* منطقة توليد الأكواد */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 max-w-md">
        <h2 className="text-xl font-bold mb-4">Generate Activation Code</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => handleGenerateCode(30)} 
            disabled={isPending === "code"} 
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            30 Days
          </button>
          <button 
            onClick={() => handleGenerateCode(365)} 
            disabled={isPending === "code"} 
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            1 Year
          </button>
        </div>
        {newCode && <div className="mt-4 p-3 bg-green-50 text-green-700 font-mono rounded">{newCode}</div>}
      </div>

      {/* جدول المشتركين */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <h2 className="text-xl font-bold p-4 border-b">Subscribers ({subscribers.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 border-b">Clinic Name</th>
                <th className="p-3 border-b">Admin Email</th>
                <th className="p-3 border-b">Status</th>
                <th className="p-3 border-b">Ends At</th>
                <th className="p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((clinic: any) => (
                <tr key={clinic.id} className="hover:bg-gray-50 border-b">
                  <td className="p-3 font-medium">{clinic.name}</td>
                  <td className="p-3 text-gray-600">{clinic.users[0]?.email || "N/A"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      clinic.subscription?.status === "ACTIVE" ? "bg-green-100 text-green-700" : 
                      clinic.subscription?.status === "TRIAL" ? "bg-yellow-100 text-yellow-700" : 
                      "bg-red-100 text-red-700"
                    }`}>
                      {clinic.subscription?.status || "NO SUB"}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {clinic.subscription?.endDate ? new Date(clinic.subscription.endDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="p-3 space-x-2">
                    <button 
                      onClick={() => handleAction(clinic.id, "ACTIVE", 30)} 
                      disabled={isPending === clinic.id}
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                    >
                      Activate +30d
                    </button>
                    <button 
                      onClick={() => handleAction(clinic.id, "SUSPENDED")} 
                      disabled={isPending === clinic.id}
                      className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
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