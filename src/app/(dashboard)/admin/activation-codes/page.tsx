import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { GenerateCodeForm } from "@/components/admin/generate-code-form"
import { getActivationCodes } from "@/actions/super-admin"

export const dynamic = 'force-dynamic';

export default async function ActivationCodesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  // جلب الباقات المتاحة لاختيارها في الفورم
  const plans = await prisma.plan.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { monthlyPrice: 'asc' }
  });

  // جلب الأكواد المولدة مسبقاً
  const codes = await getActivationCodes();

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activation Codes Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate codes linked to specific plans and durations. Clients will use these to upgrade their subscriptions.
        </p>
      </div>
      
      {/* فورم التوليد */}
      <GenerateCodeForm plans={plans} />

      {/* جدول الأكواد */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-foreground">Recently Generated Codes</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created At</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-mono font-bold tracking-wider text-foreground select-all">
                    {code.code}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-xs font-semibold">
                      {code.plan?.name || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {code.durationDays} Days
                  </td>
                  <td className="px-6 py-4">
                    {code.isUsed ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-md text-xs font-semibold">
                        Used
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md text-xs font-semibold">
                        Available
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(code.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-muted-foreground">
                    No codes generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}