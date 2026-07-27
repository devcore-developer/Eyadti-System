"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Plus } from "lucide-react"

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#F5F7FB" }}>
      <div className="px-5 pt-[76px] pb-[108px] space-y-7">{children}</div>
    </div>
  )
}

export function MobileBottomNav({ links }: { links: { label: string; href: string; icon: React.ReactNode; active?: boolean }[] }) {
  const activeIndex = links.findIndex((l) => l.active)

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-gray-100/60"
      style={{
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.06)",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
    >
      <div className="relative h-[80px] max-w-lg mx-auto flex items-center justify-around px-3">
        {/* Sliding indicator */}
        <div
          className="absolute bottom-3 left-3 right-3 rounded-2xl transition-all duration-300 ease-out pointer-events-none"
          style={{
            width: `calc(${100 / links.length}% - 8px)`,
            left: `calc(${activeIndex * (100 / links.length)}% + 4px)`,
            background: "linear-gradient(135deg, #3B82F6, #06B6D4)",
            boxShadow: "0 4px 16px rgba(59,130,246,0.25)",
            height: 40,
          }}
        />

        {links.map((item) => (
          <button
            key={item.label}
            onClick={() => (window.location.href = item.href)}
            className="relative z-10 flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-90"
          >
            <div className="transition-colors duration-200" style={{ color: item.active ? "#3B82F6" : "#94A3B8", fontSize: 24, lineHeight: 1 }}>
              {item.icon}
            </div>
            <span
              className="mt-1 font-medium transition-colors duration-200"
              style={{
                fontSize: 11,
                color: item.active ? "#3B82F6" : "#94A3B8",
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
        bottom: "calc(80px + 16px + env(safe-area-inset-bottom, 0px))",
        right: 20,
      }}
    >
      {/* Popup */}
      <div
        className="absolute bottom-[76px] right-0 w-52 bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{
          boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.9) translateY(8px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transformOrigin: "bottom right",
        }}
      >
        {actions.map((action, i) => (
          <button
            key={action.label}
            onClick={() => { router.push(action.href); setIsOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 text-left transition-colors active:bg-gray-100"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">{action.icon}</div>
            <span className="text-sm font-medium text-gray-800">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center active:scale-90 transition-transform duration-150"
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          background: "linear-gradient(135deg, #14B8A6, #3B82F6)",
          boxShadow: "0 8px 32px rgba(20,184,166,0.4)",
        }}
      >
        {isOpen ? <X className="w-6 h-6 text-white" strokeWidth={2.5} /> : <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />}
      </button>
    </div>
  )
}