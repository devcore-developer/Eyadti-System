"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifications"
import { Bell, CheckCheck, Check } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getNotificationRoute } from "@/lib/notifications/types"

interface NotificationBellProps {
  userId: string
  clinicId: string
}

const typeColors: Record<string, string> = {
  APPOINTMENT_CREATED: "bg-blue-500",
  APPOINTMENT_CANCELLED: "bg-red-500",
  PATIENT_CREATED: "bg-green-500",
  INVOICE_CREATED: "bg-amber-500",
  INVOICE_PAID: "bg-emerald-500",
  PRESCRIPTION_CREATED: "bg-purple-500",
  SYSTEM: "bg-gray-500",
}

export function NotificationBell({ userId, clinicId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [recent, setRecent] = useState<any[]>([])
  const prevUnreadCount = useRef(0)
  const dropdownRef = useRef<HTMLDivElement>(null)  // ✅ ADDED: Ref for dropdown
  const router = useRouter()

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount(userId, clinicId)
      
      if (count > prevUnreadCount.current && prevUnreadCount.current !== 0) {
        const result = await getNotifications(userId, clinicId, 1)
        if (result.notifications.length > 0) {
          const latest = result.notifications[0]
          const route = getNotificationRoute(latest.relatedEntityType ?? undefined, latest.relatedEntityId ?? undefined)
          
          toast.info(latest.title, {
            description: latest.message,
            action: {
              label: "View",
              onClick: () => router.push(route),
            },
          })
        }
      }
      
      prevUnreadCount.current = count
      setUnreadCount(count)
    } catch (error) {
      console.error("Failed to load unread count:", error)
    }
  }, [userId, clinicId, router])

  const loadRecent = useCallback(async () => {
    try {
      const result = await getNotifications(userId, clinicId, 1)
      setRecent(result.notifications.slice(0, 5))
    } catch (error) {
      console.error("Failed to load recent notifications:", error)
    }
  }, [userId, clinicId])

  useEffect(() => {
    loadUnreadCount()
  }, [userId, clinicId])

  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 120000)
    return () => clearInterval(interval)
  }, [loadUnreadCount])

  // ✅ FIXED: Added Escape key handler
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen])  // ✅ Only runs when isOpen changes

  const handleOpen = () => {
    if (!isOpen) loadRecent()
    setIsOpen(!isOpen)
  }

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      await markAsRead(n.id)
      await loadUnreadCount()
    }
    const route = getNotificationRoute(n.relatedEntityType, n.relatedEntityId)
    router.push(route)
    setIsOpen(false)
  }

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await markAllAsRead(userId, clinicId)
    await loadUnreadCount()
    await loadRecent()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div 
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#223247] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 z-50 overflow-hidden animate-scale-in"
            role="menu"
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-white/10 bg-gray-50 dark:bg-[#1D2A3B]">
              <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y dark:divide-white/5 hide-scrollbar">
              {recent.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                recent.map((n: any) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${!n.isRead ? "bg-teal-50/50 dark:bg-teal-500/10" : ""}`}
                    role="menuitem"
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${typeColors[n.type] || "bg-gray-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                          {format(new Date(n.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            await markAsRead(n.id)
                            await loadUnreadCount()
                            await loadRecent()
                          }}
                          className="shrink-0 p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-colors"
                          aria-label="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t dark:border-white/10 bg-gray-50 dark:bg-[#1D2A3B]">
              <a
                href="/notifications"
                className="block text-center text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors"
              >
                View All Notifications
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}