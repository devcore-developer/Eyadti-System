"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, CheckCheck, Check, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface SuperAdminNotification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  actionUrl: string | null
  clinicId: string | null
  clinic: { name: string } | null
  createdAt: Date
}

interface SuperAdminNotificationBellProps {
  initialNotifications?: SuperAdminNotification[]
}

const typeColors: Record<string, string> = {
  SUBSCRIPTION_SUSPENDED: "bg-red-500",
  SUBSCRIPTION_ACTIVE: "bg-green-500",
  SUBSCRIPTION_EXPIRED: "bg-amber-500",
  CLINIC_DELETED: "bg-red-600",
  CLINIC_ARCHIVED: "bg-gray-500",
  ANNOUNCEMENT_CREATED: "bg-blue-500",
  SYSTEM: "bg-gray-400",
}

export function SuperAdminNotificationBell({ initialNotifications = [] }: SuperAdminNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<SuperAdminNotification[]>(initialNotifications)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const unreadCount = notifications.filter(n => !n.isRead).length

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Failed to load SA notifications:", error)
    }
  }, [])

  // تحميل الإشعارات كل 30 ثانية
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  // إغلاق الـ dropdown عند الضغط خارجة أو Escape
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await fetch('/api/super-admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, action: 'mark_read' })
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/super-admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const handleClick = (notification: SuperAdminNotification) => {
    if (!notification.isRead) {
      handleMarkRead(notification.id)
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => { 
          setIsOpen(!isOpen) 
          if (!isOpen) loadNotifications()
        }}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-[#223247] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b dark:border-white/10 bg-gray-50 dark:bg-[#1D2A3B]">
            <h3 className="font-semibold text-sm text-foreground">Platform Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y dark:divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No platform notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer",
                    !n.isRead && "bg-teal-50/50 dark:bg-teal-500/10"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", 
                      typeColors[n.type] || "bg-gray-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-gray-400">
                          {format(new Date(n.createdAt), "MMM d, h:mm a")}
                        </span>
                        {n.clinic && (
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                            {n.clinic.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {!n.isRead && (
                        <button
                          onClick={(e) => handleMarkRead(n.id, e)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-colors"
                          aria-label="Mark as read"
                        >
                          <Check className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                      {n.actionUrl && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t dark:border-white/10 bg-gray-50 dark:bg-[#1D2A3B]">
            <p className="text-center text-xs text-muted-foreground">
              Showing {Math.min(notifications.length, 10)} of {notifications.length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}