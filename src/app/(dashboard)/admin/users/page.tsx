// src/app/(dashboard)/admin/users/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { UserTable } from "@/components/admin/user-table"

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userRole = session.user.role
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
  const isDoctor = userRole === "DOCTOR"
  const isReception = userRole === "RECEPTIONIST"

  // ── Non-admin roles: only fetch their own user record ──
  const whereClause = isAdmin
    ? { clinicId: session.user.clinicId }
    : { id: session.user.id, clinicId: session.user.clinicId }

  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  // Page title and description based on role
  const pageTitle = isAdmin ? "User Management" : "Users & Roles"
  const pageDescription = isAdmin
    ? `${users.length} user${users.length !== 1 ? "s" : ""} in your clinic`
    : "Manage your account information"

  // Show "Add User" button only for Admin
  const showCreate = isAdmin

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pageDescription}
          </p>
        </div>
        {showCreate && (
          <Link
            href="/admin/users/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add User
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <UserTable users={users} currentUserId={session.user.id} />
      </div>
    </div>
  )
}