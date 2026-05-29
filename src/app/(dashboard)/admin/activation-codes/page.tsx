import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GenerateCodeForm } from "@/components/admin/generate-code-form"

export default async function ActivationCodesPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activation Codes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate Signup codes to allow new clients to register, or Subscription codes to extend their billing period.
        </p>
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow max-w-md">
        <GenerateCodeForm />
      </div>
    </div>
  )
}