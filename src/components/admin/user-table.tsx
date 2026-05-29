import Link from "next/link"
import { Role } from "@prisma/client"
import { MobileCard, MobileCardItem } from "@/components/ui/mobile-card"

type UserRow = {
  id: string
  name: string
  email: string
  role: Role
}

type Props = {
  users: UserRow[]
  currentUserId: string
}

const roleBadge: Record<Role, string> = {
  SUPER_ADMIN: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-400",
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/50 dark:text-violet-400",
  DOCTOR: "bg-primary/10 text-primary ring-primary/20 dark:bg-primary/20 dark:text-primary",
  RECEPTIONIST: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/50 dark:text-sky-400",
};

export function UserTable({ users, currentUserId }: Props) {
  if (users.length === 0) {
    return <div className="py-16 text-center text-muted-foreground">No users found.</div>
  }

  return (
    <div className="space-y-4">
      
      {/* ━━━ DESKTOP TABLE ━━━ */}
      <div className="hidden md:block rounded-xl border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#1D2A3B] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 dark:bg-[#223247]/50 border-b border-[rgba(148,163,184,0.1)]">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-[#223247]/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">
                    {user.name}
                    {user.id === currentUserId && (
                      <span className="ml-2 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">You</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">{user.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${roleBadge[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/users/edit/${user.id}`} className="font-medium text-primary hover:text-primary/80 text-xs">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ━━━ MOBILE CARDS ━━━ */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {users.map((user) => (
          <MobileCard key={user.id}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-sm">{user.name}</h3>
                {user.id === currentUserId && <span className="text-[10px] text-primary">It's you</span>}
              </div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${roleBadge[user.role]}`}>
                {user.role}
              </span>
            </div>
            <MobileCardItem label="Email" value={user.email} />
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-end">
              <Link href={`/admin/users/edit/${user.id}`} className="text-xs font-medium text-primary">
                Edit User
              </Link>
            </div>
          </MobileCard>
        ))}
      </div>
    </div>
  )
}