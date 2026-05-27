// src/app/(dashboard)/admin/users/new/page.tsx
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/permissions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { UserForm } from "@/components/admin/user-form"

export default async function NewUserPage() {
  try {
    await requireRole("ADMIN")
  } catch (error) {
    if (error instanceof AuthenticationError) redirect("/login")
    if (error instanceof AuthorizationError) redirect("/admin/users")
    throw error
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Users
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Create New User</h1>
        <p className="mt-1 text-sm text-gray-500">Add a new doctor, receptionist, or admin to your clinic.</p>
      </div>
      <UserForm />
    </div>
  )
}