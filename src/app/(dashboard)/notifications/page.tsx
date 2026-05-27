import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getNotifications, markAllAsRead, markAsRead } from "@/lib/actions/notifications"
import { Bell, CheckCheck } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>
}) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user?.clinicId) redirect("/login")

  const page = Number(params.page) || 1
  const filter = params.filter || undefined

  const { notifications, total, pages } = await getNotifications(
    session.user.id,
    session.user.clinicId,
    page,
    filter
  )

  const handleMarkAllRead = async () => {
    "use server"
    await markAllAsRead(session.user.id, session.user.clinicId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <Bell className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">{total} total notifications</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Link
              href="/notifications"
              className={`px-3 py-1.5 text-xs font-medium ${!filter ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              All
            </Link>
            <Link
              href="/notifications?filter=unread"
              className={`px-3 py-1.5 text-xs font-medium ${filter === "unread" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              Unread
            </Link>
            <Link
              href="/notifications?filter=read"
              className={`px-3 py-1.5 text-xs font-medium ${filter === "read" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              Read
            </Link>
          </div>

          <form action={handleMarkAllRead}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden divide-y">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications found</p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <div
              key={n.id}
              className={`p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                !n.isRead ? "bg-teal-50/30 border-l-4 border-l-teal-500" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"}`}>
                  {n.title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(n.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              {!n.isRead && (
                <form action={async () => { "use server"; await markAsRead(n.id) }}>
                  <button type="submit" className="text-xs text-teal-600 hover:underline">
                    Mark read
                  </button>
                </form>
              )}
            </div>
          ))
        )}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/notifications?page=${p}${filter ? `&filter=${filter}` : ""}`}
              className={`px-3 py-1.5 text-xs rounded border ${p === page ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}