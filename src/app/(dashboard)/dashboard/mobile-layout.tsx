"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Plus } from "lucide-react"

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-dvh bg-[#F5F7FB] dark:bg-[#0F172A] overflow-x-hidden">
      <div 
        className="px-4 pt-5 space-y-5 w-full max-w-[500px] mx-auto"
        style={{ 
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 24px)' 
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function MobileBottomNav({ links }: { links: { label: string; href: string; icon: React.ReactNode; active?: boolean }[] }) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#17212F] border-t border-gray-100 dark:border-white/[0.06]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        boxSizing: "border-box",
      }}
    >
      <div className="h-[64px] max-w-[500px] mx-auto flex items-center justify-around px-4">
        {links.map((item) => (
          <button
            key={item.label}
            onClick={() => (window.location.href = item.href)}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 active:scale-90 transition-all duration-150"
          >
            <div style={{ color: item.active ? "#6B9CFF" : "#94A3B8" }}>
              {item.icon}
            </div>
            <span
              style={{
                fontSize: 10,
                color: item.active ? "#6B9CFF" : "#94A3B8",
                fontWeight: item.active ? 600 : 500,
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function MobileFab({ actions }: { actions: { label: string; href: string; icon: React.ReactNode }[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  return (
    <div
      className="fixed z-50"
      style={{
        bottom: "calc(72px + 12px + env(safe-area-inset-bottom, 0px))",
        right: 16,
      }}
    >
      {isOpen && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <div
        className="absolute bottom-[68px] right-0 w-48 bg-white dark:bg-[#223247] rounded-2xl border border-gray-100/80 dark:border-white/[0.06] overflow-hidden"
        style={{
          boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.95) translateY(8px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transformOrigin: "bottom right",
        }}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => { router.push(action.href); setIsOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.06] text-left transition-colors active:bg-gray-100 dark:active:bg-white/[0.08]"
          >
            <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-white/[0.06] flex items-center justify-center text-gray-500 dark:text-gray-400">{action.icon}</div>
            <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center active:scale-90 transition-transform duration-150"
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: "linear-gradient(135deg, #5BC0BE, #6B9CFF)",
          boxShadow: "0 4px 20px rgba(107,156,255,0.35)",
        }}
      >
        {isOpen ? <X className="w-5 h-5 text-white" strokeWidth={2.5} /> : <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />}
      </button>
    </div>
  )
}