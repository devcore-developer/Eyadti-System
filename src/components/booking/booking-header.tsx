"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Globe } from "lucide-react"

export function BookingHeader() {
  const [dark, setDark] = useState(false)
  const [lang, setLang] = useState<"EN" | "AR">("EN")

  useEffect(() => {
    const root = document.documentElement
    if (dark) root.classList.add("dark")
    else root.classList.remove("dark")
  }, [dark])

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLang(l => l === "EN" ? "AR" : "EN")}
        className="h-9 px-3 rounded-xl border border-gray-200 bg-white/80 hover:bg-gray-50 flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all duration-200 hover:shadow-sm"
        aria-label="Switch language"
      >
        <Globe className="w-3.5 h-3.5" />
        {lang}
      </button>

      <button
        onClick={() => setDark(d => !d)}
        className="h-9 w-9 rounded-xl border border-gray-200 bg-white/80 hover:bg-gray-50 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-200 hover:shadow-sm"
        aria-label="Toggle dark mode"
      >
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </div>
  )
}