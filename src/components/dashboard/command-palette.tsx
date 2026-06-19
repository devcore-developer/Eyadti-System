"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { 
  Search, Plus, LayoutDashboard, Users, FileText, 
  CalendarDays, Settings, ClipboardList, Building2, Bell, X, 
  Loader2, UserCircle, Stethoscope
} from "lucide-react"
import { globalSearch } from "@/lib/actions/super-admin"
import { cn } from "@/lib/utils"

// الأكشنز الثابتة
const staticActions = [
  { id: "nav-1", name: "Go to Dashboard", icon: LayoutDashboard, href: "/dashboard", category: "Navigate" },
  { id: "nav-2", name: "Go to Patients", icon: Users, href: "/patients", category: "Navigate" },
  { id: "nav-3", name: "Go to Appointments", icon: CalendarDays, href: "/appointments", category: "Navigate" },
  { id: "nav-4", name: "Go to Invoices", icon: FileText, href: "/invoices", category: "Navigate" },
  { id: "create-1", name: "Create Patient", icon: Plus, href: "/patients/new", category: "Quick Action" },
  { id: "create-2", name: "Create Appointment", icon: CalendarDays, href: "/appointments/new", category: "Quick Action" },
  { id: "create-3", name: "Create Invoice", icon: FileText, href: "/invoices/new", category: "Quick Action" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [dbResults, setDbResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((current) => !current)
      }
      if (e.key === "Escape") {
        setOpen(false)
        setSearch("")
        setDbResults([])
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setSearch("")
      setDbResults([])
    }
  }, [open])

  // Debounced Search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    if (!search.trim()) {
      setDbResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceRef.current = setTimeout(async () => {
      const data = await globalSearch(search)
      setDbResults(data.results)
      setIsSearching(false)
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const runAction = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const filteredStaticActions = staticActions.filter(
    (action) => action.name.toLowerCase().includes(search.toLowerCase())
  )

  const showDbResults = dbResults.length > 0 || isSearching
  const showStaticResults = !search.trim() || filteredStaticActions.length > 0

  // أيقونات نوع البيانات
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'clinic': return Building2
      case 'user': return UserCircle
      case 'patient': return Stethoscope
      default: return Search
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={() => setOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1A2332] border border-border/50 shadow-2xl rounded-2xl overflow-hidden animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center border-b border-border/50 px-4">
          {isSearching ? (
            <Loader2 className="mr-2 h-4 w-4 shrink-0 text-primary animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            placeholder="Search clinics, users, or type a command..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-14 bg-transparent text-foreground outline-none text-base placeholder:text-muted-foreground"
          />
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* Results List */}
        <div className="max-h-[350px] overflow-y-auto py-2 px-2">
          
          {/* Database Search Results */}
          {showDbResults && (
            <div className="mb-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Results
              </div>
              {isSearching ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Searching...
                </div>
              ) : dbResults.length === 0 && search.trim() ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No results found for "{search}"</p>
                </div>
              ) : (
                dbResults.map((result) => {
                  const Icon = getTypeIcon(result.type)
                  return (
                    <button
                      key={result.id}
                      onClick={() => runAction(result.href)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}

          {/* Static Actions */}
          {showStaticResults && (
            <div className={cn(showDbResults && "border-t border-border/50 pt-2")}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {search.trim() ? "Commands" : "Quick Actions"}
              </div>
              {filteredStaticActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => runAction(action.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-left font-medium">{action.name}</span>
                    <span className="text-xs text-muted-foreground">{action.category}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/50 px-4 py-2 bg-muted/30">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px] font-mono">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px] font-mono">↵</kbd> Select</span>
          </div>
          <span className="text-xs text-muted-foreground">by Nexora</span>
        </div>
      </div>
    </div>,
    document.body
  )
}