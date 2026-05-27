"use client"

import { useTransition, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createUser, updateUser } from "@/lib/actions/admin"
import type { ActionResult } from "@/types"
import { Role } from "@prisma/client"
import { Building2, Check } from "lucide-react"

type Branch = { id: string; name: string; code: string }

type UserData = {
  id?: string
  name: string
  email: string
  role: Role
}

type Props = {
  user?: UserData
  branches?: Branch[]
  userBranchIds?: string[]
}

export function UserForm({ user, branches = [], userBranchIds = [] }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [selectedBranches, setSelectedBranches] = useState<string[]>(userBranchIds)
  const [currentRole, setCurrentRole] = useState<Role>(user?.role ?? Role.RECEPTIONIST)

  const isEdit = !!user?.id
  const isAdmin = currentRole === Role.ADMIN

  useEffect(() => {
    if (isAdmin) {
      setSelectedBranches(branches.map(b => b.id))
    }
  }, [isAdmin, branches])

  function handleResult(result: ActionResult) {
    if (!result.success) {
      setError(result.error || "Something went wrong")
      setFieldErrors(result.fieldErrors || {})
    } else {
      router.push("/admin/users")
      router.refresh()
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    
    // إضافة الفروع المحددة إلى FormData
    formData.delete('branchIds') // تنظيف أي قيم سابقة
    selectedBranches.forEach(id => formData.append('branchIds', id))

    startTransition(async () => {
      if (isEdit && user?.id) {
        const result = await updateUser(user.id, formData)
        handleResult(result)
      } else {
        const result = await createUser(formData)
        handleResult(result)
      }
    })
  }

  function toggleBranch(branchId: string) {
    if (isAdmin) return
    setSelectedBranches(prev => 
      prev.includes(branchId) 
        ? prev.filter(id => id !== branchId) 
        : [...prev, branchId]
    )
  }

  function fieldError(name: string): string | undefined {
    return fieldErrors[name]?.[0]
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={user?.name ?? ""}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {fieldError("name") && <p className="mt-1 text-xs text-red-600">{fieldError("name")}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={user?.email ?? ""}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {fieldError("email") && <p className="mt-1 text-xs text-red-600">{fieldError("email")}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password {!isEdit && <span className="text-red-500">*</span>}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required={!isEdit}
            placeholder={isEdit ? "Leave blank to keep current" : ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {fieldError("password") && <p className="mt-1 text-xs text-red-600">{fieldError("password")}</p>}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            name="role"
            defaultValue={user?.role ?? ""}
            required
            onChange={(e) => setCurrentRole(e.target.value as Role)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select Role...</option>
            <option value={Role.ADMIN}>Admin</option>
            <option value={Role.DOCTOR}>Doctor</option>
            <option value={Role.RECEPTIONIST}>Receptionist</option>
          </select>
          {fieldError("role") && <p className="mt-1 text-xs text-red-600">{fieldError("role")}</p>}
        </div>
      </div>

      {/* Branch Access Multi-Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Branch Access <span className="text-red-500">*</span>
        </label>
        {isAdmin ? (
          <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-200">
            Admins automatically have access to all branches.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-gray-50 max-h-48 overflow-y-auto">
            {branches.map((branch) => (
              <div
                key={branch.id}
                onClick={() => toggleBranch(branch.id)}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                  selectedBranches.includes(branch.id) 
                    ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                    : 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                  selectedBranches.includes(branch.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {selectedBranches.includes(branch.id) && <Check className="h-3 w-3 text-white" />}
                </div>
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">{branch.name}</span>
              </div>
            ))}
            {branches.length === 0 && (
              <p className="col-span-2 text-sm text-gray-500 text-center py-4">No branches available</p>
            )}
          </div>
        )}
        {fieldError("branchIds") && <p className="mt-1 text-xs text-red-600">{fieldError("branchIds")}</p>}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {isPending ? "Saving..." : isEdit ? "Update User" : "Create User"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  )
}