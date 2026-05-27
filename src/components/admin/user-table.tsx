import Link from "next/link"
import { Role } from "@prisma/client"

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
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/50 dark:text-violet-400 dark:ring-violet-400/20",
  DOCTOR: "bg-primary/10 text-primary ring-primary/20 dark:bg-primary/20 dark:text-primary",
  RECEPTIONIST: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/50 dark:text-sky-400 dark:ring-sky-400/20",
}

export function UserTable({ users, currentUserId }: Props) {
  if (users.length === 0) {
    return <div className="py-16 text-center text-muted-foreground">No users found.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {users.map((user) => (
            <tr key={user.id} className="transition-colors hover:bg-muted/30">
              <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-foreground">
                {user.name}
                {user.id === currentUserId && (
                  <span className="ml-2 text-[10px] font-medium text-primary">You</span>
                )}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{user.email}</td>
              <td className="whitespace-nowrap px-5 py-4 text-sm">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${roleBadge[user.role]}`}>
                  {user.role}
                </span>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-right text-sm">
                <Link
                  href={`/admin/users/edit/${user.id}`}
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}