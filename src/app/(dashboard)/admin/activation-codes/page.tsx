import { getActivationCodes, getActivePlansForCodes } from "@/lib/actions/admin"
import { GenerateCodeForm } from "@/components/admin/generate-code-form"
import { ActivationCodesClient } from "@/components/admin/activation-codes-client"

export default async function ActivationCodesPage() {
  const [codes, plans] = await Promise.all([
    getActivationCodes(),
    getActivePlansForCodes(),
  ])

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Activation Codes</h1>
        <span className="text-sm text-muted-foreground">{codes.length} total</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Generate Form */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Generate New Code</h2>
          <GenerateCodeForm plans={plans} />
        </div>

        {/* Right: Codes List with Search/Filter/Sort */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-6 overflow-hidden">
          <h2 className="text-xl font-bold mb-4">Code Management</h2>
          <ActivationCodesClient codes={codes as any} />
        </div>
      </div>
    </div>
  )
}