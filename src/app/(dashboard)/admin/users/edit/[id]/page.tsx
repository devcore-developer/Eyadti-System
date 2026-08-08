import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UserForm } from "@/components/admin/user-form"

interface EditUserPageProps {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userRole = session.user.role
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
  const isSelfEdit = true // Doctor and Reception can only reach here for their own ID (enforced by page query)

  const { id } = await params

  // ── Security: Doctor/Reception can only edit their OWN record ──
  if (!isAdmin && session.user.id !== id) {
    redirect("/admin/users")
  }

  const [user, branches] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        specialty: true,
        degree: true,
        userBranches: { 
          select: { branchId: true } 
        }
      },
    }),
    prisma.branch.findMany({
      where: { clinicId: session.user.clinicId, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!user) redirect("/admin/users")

  const branchIds = user.userBranches.map(ub => ub.branchId)

  // Page title based on context
  const pageTitle = isAdmin ? "Edit User" : "Edit My Account"
  const pageDescription = isAdmin
    ? `Update details and permissions for ${user.name}`
    : "Update your account information"

  return (
    <div className="space-y-6 animate-fade">
      <div>
        <h1 className="text-page-title text-foreground">{pageTitle}</h1>
        <p className="text-body text-muted-foreground mt-1">
          {pageDescription}
        </p>
      </div>

      <div className="premium-card p-6 md:p-8">
        <UserForm 
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
            specialty: user.specialty,
            degree: user.degree,
          }}
          branches={branches} 
          userBranchIds={branchIds}
          readOnlyRole={!isAdmin}
        />
      </div>
    </div>
  )
}