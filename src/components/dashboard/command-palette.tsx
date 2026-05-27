"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { 
  Search, Plus, LayoutDashboard, Users, FileText, 
  CalendarDays, Settings, ClipboardList, Building2, Bell, X
} from "lucide-react"

const actions = [
  { id: 1, name: "Create Patient", icon: Users, href: "/patients/new", category: "Create" },
  { id: 2, name: "Create Appointment", icon: CalendarDays, href: "/appointments/new", category: "Create" },
  { id: 3, name: "Create Invoice", icon: FileText, href: "/invoices/new", category: "Create" },
  { id: 4, name: "Create Prescription", icon: ClipboardList, href: "/patients", category: "Create" },
  { id: 5, name: "Go to Dashboard", icon: LayoutDashboard, href: "/dashboard", category: "Navigate" },
  { id: 6, name: "Go to Patients", icon: Users, href: "/patients", category: "Navigate" },
  { id: 7, name: "Go to Appointments", icon: CalendarDays, href: "/appointments", category: "Navigate" },
  { id: 8, name: "Go to Invoices", icon: FileText, href: "/invoices", category: "Navigate" },
  { id: 9, name: "Go to Settings", icon: Settings, href: "/settings", category: "Navigate" },
  { id: 10, name: "Go to Branches", icon: Building2, href: "/settings/branches", category: "Navigate" },
  { id: 11, name: "View Notifications", icon: Bell, href: "/notifications", category: "Navigate" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((current) => !current)
      }
      if (e.key === "Escape") {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const runAction = useCallback((action: typeof actions[0]) => {
    setOpen(false)
    setSearch("")
    router.push(action.href)
  }, [router])

  const filteredActions = actions.filter(
    (action) => action.name.toLowerCase().includes(search.toLowerCase())
  )

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade" 
        onClick={() => { setOpen(false); setSearch("") }}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1A2332] border border-[rgba(148,163,184,0.15)] dark:border-[rgba(255,255,255,0.08)] shadow-[0_25px_50px_rgba(107,156,255,0.15)] rounded-2xl overflow-hidden animate-scale-in">
        {/* Header / Search Input */}
        <div className="flex items-center border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] px-4">
          <Search className="mr-2 h-4 w-4 shrink-0 text-[#6B9CFF]" />
          <input
            ref={inputRef}
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-12 bg-transparent text-foreground outline-none text-base placeholder:text-muted-foreground"
          />
          <button onClick={() => { setOpen(false); setSearch("") }} className="p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* List */}
        <div className="max-h-[300px] overflow-y-auto py-2 px-2">
          {filteredActions.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          )}
          
          {filteredActions.length > 0 && (
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Actions</div>
          )}
          
          {filteredActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => runAction(action)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-gradient-to-r hover:from-[#F5F8FF] hover:to-[#EEF3FF] dark:hover:from-[#223247] dark:hover:to-[#1D2A3B] transition-colors duration-150 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0F8FF] dark:bg-[#1D2A3B] text-[#6B9CFF] group-hover:shadow-sm transition-all">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="flex-1 text-left font-medium">{action.name}</span>
                <span className="text-xs text-muted-foreground">{action.category}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}