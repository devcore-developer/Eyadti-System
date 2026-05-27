// src/components/notifications/notification-bell.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifications"
import { Bell, CheckCheck, Check } from "lucide-react"
import { format } from "date-fns"

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

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount(userId, clinicId)
      setUnreadCount(count)
    } catch (error) {
      console.error("Failed to load unread count:", error)
    }
  }, [userId, clinicId])

  const loadRecent = useCallback(async () => {
    try {
      const result = await getNotifications(userId, clinicId, 1)
      setRecent(result.notifications.slice(0, 5))
    } catch (error) {
      console.error("Failed to load recent notifications:", error)
    }
  }, [userId, clinicId])

  // ← تحميل أول مرة
  useEffect(() => {
    loadUnreadCount()
  }, [loadUnreadCount])

  // ← تحديث تلقائي كل 15 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 15000)
    return () => clearInterval(interval)
  }, [loadUnreadCount])

  const handleOpen = () => {
    if (!isOpen) loadRecent()
    setIsOpen(!isOpen)
  }

  const handleMarkRead = async (id: string) => {
    await markAsRead(id)
    await loadUnreadCount()
    await loadRecent()
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead(userId, clinicId)
    await loadUnreadCount()
    await loadRecent()
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y">
              {recent.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  No notifications yet
                </div>
              ) : (
                recent.map((n: any) => (
                  <div
                    key={n.id}
                    className={`p-3 hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-teal-50/50" : ""}`}
                  >
                    <div className="flex gap-2">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${typeColors[n.type] || "bg-gray-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{n.title}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {format(new Date(n.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="shrink-0 p-1 hover:bg-gray-200 rounded"
                        >
                          <Check className="h-3 w-3 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-2 border-t bg-gray-50">
              <a
                href="/notifications"
                className="block text-center text-xs font-medium text-teal-600 hover:text-teal-700"
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