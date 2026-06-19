import { getActivationCodes } from "@/lib/actions/admin"
import { GenerateCodeForm } from "@/components/admin/generate-code-form"
// إذا كانت copyToClipboard غير موجود، يمكنك استخدام navigator.clipboard مباشرة
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  toast.success("Code copied!")
}

export default async function ActivationCodesPage() {
  const codes = await getActivationCodes()

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Activation Codes</h1>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Generate New Code</h2>
          <GenerateCodeForm />
        </div>

        {/* Right: List */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border-slate-200 dark:border-slate-700/50 p-6 overflow-hidden">
          <h2 className="text-xl font-bold mb-4">Generated Codes</h2>
          <div className="space-y-4">
            {codes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed">No codes found.</div>
            ) : (
              codes.map((code) => (
                <div key={code.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{code.code}</span>
                    <span className="text-xs text-muted-foreground">{new Date(code.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => {
                      // استخدام navigator.clipboard كبديل عن copyToClipboard
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(code.code)
                        toast.success("Code copied!")
                      }
                    }}
                    className="shrink-0 p-2 bg-white dark:bg-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <span className="text-xs font-medium">Copy</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}