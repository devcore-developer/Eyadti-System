"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Plus } from "lucide-react"

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="px-4 pt-20 pb-28 space-y-5">
        {children}
      </div>
    </div>
  )
}

export function MobileBottomNav({ links }: { links: { label: string; href: string; icon: React.ReactNode; active?: boolean }[] }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {links.map((item) => (
          <button 
            key={item.label} 
            onClick={() => window.location.href = item.href} 
            className="flex flex-col items-center justify-center w-16 h-full relative group"
          >
            {item.active && <div className="absolute -top-0 w-8 h-1 bg-[#6B9CFF] rounded-full" />}
            <div className={`p-1 transition-colors ${item.active ? 'text-[#6B9CCF]' : 'text-gray-400 group-hover:text-gray-600'}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] mt-0.5 font-medium transition-colors ${item.active ? 'text-[#6B9CCF]' : 'text-gray-400 group-hover:text-gray-600'}`}>
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
    <div className="fixed z-50" style={{ bottom: '108px', right: '20px' }}>
      <div className={`absolute bottom-16 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? "scale-100 opacity-100" : "scale-90 opacity-0 pointer-events-none"}`}>
        {actions.map((action) => (
          <button 
            key={action.label} 
            onClick={() => { router.push(action.href); setIsOpen(false) }} 
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-sm font-medium text-gray-800"
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative h-14 w-14 rounded-full bg-[#6B9CFF] text-white shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-90 transition-transform"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  )
}