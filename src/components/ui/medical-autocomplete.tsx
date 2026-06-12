"use client"

import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { Loader2 } from "lucide-react"

interface MedicalAutocompleteProps {
  apiUrl: string
  placeholder?: string
  onSelect: (item: any) => void
  fieldName?: string
}

export function MedicalAutocomplete({ apiUrl, placeholder = "Search...", onSelect, fieldName = "name" }: MedicalAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const wrapperRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // تحديث مكان الـ Dropdown بشكل فوري (Sync) قبل ما المتصفح يرسم أي حاجة
  useLayoutEffect(() => {
    if (isOpen && wrapperRef.current && dropdownRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      const dropdown = dropdownRef.current
      
      dropdown.style.position = "fixed"
      dropdown.style.top = `${rect.bottom + 4}px`
      dropdown.style.left = `${rect.left}px`
      dropdown.style.width = `${rect.width}px`
      dropdown.style.zIndex = "9999"
      dropdown.style.opacity = "1" // نخليها ظاهرة بعد ما يتحدد مكانها
    }
  }, [isOpen, query, results])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`${apiUrl}?q=${encodeURIComponent(query)}`)
        if (!res.ok) { setResults([]); setIsOpen(false); return }
        
        const data = await res.json()
        if (Array.isArray(data)) {
          setResults(data)
          setIsOpen(data.length > 0)
        } else {
          setResults([])
          setIsOpen(false)
        }
      } catch (error) {
        console.error(error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, apiUrl])

  const handleSelect = (item: any) => {
    setQuery(item.name)
    setIsOpen(false)
    onSelect(item)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 rounded-xl border dark:bg-[#1D2A3B] dark:border-[rgba(255,255,255,0.06)] focus:ring-2 focus:ring-[#6B9CFF] outline-none"
        placeholder={placeholder}
        autoComplete="off"
      />
      <input type="hidden" name={fieldName} value={results.find(r => r.name === query)?.name || query} />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* الـ Portal اللي بيتنسخ على الـ Body مباشرة وبمعرف خاص */}
      {isOpen && typeof window !== "undefined" && createPortal(
        <div 
          ref={dropdownRef} 
          id="medical-autocomplete-portal" // ← معرف مهم جداً عشان الدايالوج يقفلش
          style={dropdownStyle}
          className="max-h-60 overflow-auto rounded-xl bg-white dark:bg-[#223247] border-2 border-[#6B9CFF] shadow-2xl"
        >
          {results.map((item) => (
            <button
              type="button"
              key={item.id || item.name}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#6B9CFF]/10 transition-colors flex justify-between items-center text-foreground"
              onClick={() => handleSelect(item)}
            >
              <span className="font-medium">{item.name}</span>
              {item.category && <span className="text-xs text-muted-foreground">{item.category}</span>}
              {item.specialty && <span className="text-xs text-muted-foreground">{item.specialty}</span>}
              {item.icd10Code && <span className="text-xs text-[#5BC0BE]">{item.icd10Code}</span>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}