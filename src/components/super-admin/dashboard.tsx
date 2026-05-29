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

  const handleGenerateCode = async (type: "SIGNUP" | "SUBSCRIPTION", days: number) => {
    setIsPending(`code-${type}-${days}`)
    const res = await superAdminGenerateCode(type, days)
    if (res.success) {
      setNewCode(res.message || "Code generated successfully!") 
    }
    setIsPending(null)
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Super Admin Panel - Platform Control</h1>

      {/* منطقة توليد الأكواد */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Generate Codes</h2>
        <div className="flex flex-wrap gap-3">
          {/* زرار كود التسجيل (بنفسجي) */}
          <button 
            onClick={() => handleGenerateCode("SIGNUP", 3)} 
            disabled={isPending === "code-SIGNUP-3"} 
            className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            Signup Code (3 Days Trial)
          </button>
          
          {/* أكواد الاشتراك (أزرق) */}
          <button 
            onClick={() => handleGenerateCode("SUBSCRIPTION", 30)} 
            disabled={isPending === "code-SUBSCRIPTION-30"} 
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            1 Month (30d)
          </button>
          <button 
            onClick={() => handleGenerateCode("SUBSCRIPTION", 180)} 
            disabled={isPending === "code-SUBSCRIPTION-180"} 
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            6 Months (180d)
          </button>
          <button 
            onClick={() => handleGenerateCode("SUBSCRIPTION", 365)} 
            disabled={isPending === "code-SUBSCRIPTION-365"} 
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            1 Year (365d)
          </button>
        </div>
        {newCode && <div className="mt-4 p-3 bg-green-50 text-green-700 font-mono text-center rounded border border-green-200">{newCode}</div>}
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