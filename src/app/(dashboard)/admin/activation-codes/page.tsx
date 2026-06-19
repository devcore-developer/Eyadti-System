import { getActivationCodes } from "@/lib/actions/admin"
import { GenerateCodeForm } from "@/components/admin/generate-code-form"
import { CodeCopyButton } from "@/components/admin/code-copy-button"
import { prisma } from "@/lib/db"

export default async function ActivationCodesPage() {
  const [codes, plans] = await Promise.all([
    getActivationCodes(),
    prisma.plan.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true, monthlyPrice: true },
      orderBy: { name: "asc" }
    })
  ])

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Activation Codes</h1>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Generate New Code</h2>
          <GenerateCodeForm plans={plans} />
        </div>

        {/* Right: List */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-6 overflow-hidden">
          <h2 className="text-xl font-bold mb-4">Generated Codes</h2>
          <div className="space-y-4">
            {codes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed">No codes found.</div>
            ) : (
              codes.map((code) => (
                <div key={code.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{code.code}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(code.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{code.durationDays} days</span>
                      {code.isUsed ? (
                        <span className="text-red-500 font-medium">Used</span>
                      ) : (
                        <span className="text-green-500 font-medium">Active</span>
                      )}
                    </div>
                  </div>
                  {!code.isUsed && <CodeCopyButton code={code.code} />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}