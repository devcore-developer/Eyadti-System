"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Plus } from "lucide-react"

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <div className="px-4 pt-[68px] pb-[100px] space-y-5">{children}</div>
    </div>
  )
}

export function MobileBottomNav({ links }: { links: { label: string; href: string; icon: React.ReactNode; active?: boolean }[] }) {
  const activeIndex = links.findIndex((l) => l.active)

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 border-t border-gray-100/80"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -1px 12px rgba(0,0,0,0.04)",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
    >
      <div className="relative h-[72px] max-w-lg mx-auto flex items-center justify-around px-2">
        {/* Sliding indicator */}
        <div
          className="absolute bottom-2 left-2 right-2 rounded-[14px] transition-all duration-300 ease-out pointer-events-none"
          style={{
            width: `calc(${100 / links.length}% - 6px)`,
            left: `calc(${activeIndex * (100 / links.length)}% + 3px)`,
            background: "linear-gradient(135deg, #5BC0BE, #6B9CFF)",
            boxShadow: "0 2px 12px rgba(107,156,255,0.25)",
            height: 36,
          }}
        />

        {links.map((item) => (
          <button
            key={item.label}
            onClick={() => (window.location.href = item.href)}
            className="relative z-10 flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-90"
          >
            <div className="transition-colors duration-200" style={{ color: item.active ? "#6B9CFF" : "#94A3B8" }}>
              {item.icon}
            </div>
            <span
              className="mt-0.5 transition-colors duration-200"
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
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Popup */}
      <div
        className="absolute bottom-[68px] right-0 w-48 bg-white rounded-2xl border border-gray-100/80 overflow-hidden"
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
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors active:bg-gray-100"
          >
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">{action.icon}</div>
            <span className="text-[13px] font-medium text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Button */}
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