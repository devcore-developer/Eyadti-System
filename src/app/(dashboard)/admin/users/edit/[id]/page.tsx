// src/app/(dashboard)/admin/users/edit/[id]/page.tsx
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { UserForm } from "@/components/admin/user-form"

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  let session
  try {
    session = await requireRole("ADMIN")
  } catch (error) {
    if ((error as any)?.name === "AuthenticationError") redirect("/login")
    if ((error as any)?.name === "AuthorizationError") redirect("/admin/users")
    throw error
  }

  const { id } = await params

  const user = await prisma.user.findFirst({
    where: { id, clinicId: session.clinicId },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true,
      branches: { select: { id: true } } 
    },
  })

  if (!user) notFound()

  const branches = await prisma.branch.findMany({
    where: { clinicId: session.clinicId, isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" }
  })

  const userBranchIds = user?.branches ? (user.branches as any[]).map((b: any) => b.id) : []

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to Users
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit User</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update details and branch access for {user.name}.
        </p>
      </div>
      <UserForm user={user} branches={branches} userBranchIds={userBranchIds} />
    </div>
  )
}