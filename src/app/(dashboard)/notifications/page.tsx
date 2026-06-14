import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getNotifications, markAllAsRead, markAsRead } from "@/lib/actions/notifications"
import { Bell, CheckCheck } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { getNotificationRoute } from "@/lib/notifications/types"

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/10">
            <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">{total} total notifications</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex border dark:border-white/10 rounded-lg overflow-hidden">
            <Link
              href="/notifications"
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${!filter ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-white dark:bg-[#223247] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}`}
            >
              All
            </Link>
            <Link
              href="/notifications?filter=unread"
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === "unread" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-white dark:bg-[#223247] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}`}
            >
              Unread
            </Link>
            <Link
              href="/notifications?filter=read"
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === "read" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-white dark:bg-[#223247] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}`}
            >
              Read
            </Link>
          </div>

          <form action={handleMarkAllRead}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-[#223247] border dark:border-white/10 rounded-2xl overflow-hidden divide-y dark:divide-white/5 shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-16 text-center">
            <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No notifications found</p>
          </div>
        ) : (
          notifications.map((n: any) => {
            const route = getNotificationRoute(n.relatedEntityType, n.relatedEntityId)
            return (
              <Link
                key={n.id}
                href={route}
                className={`block p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                  !n.isRead ? "bg-teal-50/30 dark:bg-teal-500/5 border-l-4 border-l-teal-500" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/90"}`}>
                      {n.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {format(new Date(n.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  {!n.isRead && (
                    <form action={async () => { "use server"; await markAsRead(n.id) }}>
                      <button 
                        type="submit" 
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline shrink-0 mt-1"
                      >
                        Mark read
                      </button>
                    </form>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/notifications?page=${p}${filter ? `&filter=${filter}` : ""}`}
              className={`px-3 py-1.5 text-xs rounded-lg border dark:border-white/10 transition-colors ${p === page ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "hover:bg-gray-50 dark:hover:bg-white/5 text-foreground"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}