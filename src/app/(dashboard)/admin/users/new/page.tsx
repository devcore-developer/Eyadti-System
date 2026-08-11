import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/permissions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { UserForm } from "@/components/admin/user-form"

export default async function NewUserPage() {
  try {
    const session = await requireRole("ADMIN")
    
    const branches = await prisma.branch.findMany({
      where: { clinicId: session.clinicId, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    })

    return (
      <div className="space-y-6">
        <div>
          <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Users
          </Link>
          <h1 className="text-2xl font-bold mt-2">Add New User</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new user account and assign branch access.
          </p>
        </div>

        <div className="premium-card p-6 md:p-8">
          <UserForm branches={branches} />
        </div>
      </div>
    )
  } catch (error) {
    if (error instanceof AuthenticationError) redirect("/login")
    if (error instanceof AuthorizationError) redirect("/admin/users")
    throw error
  }
}