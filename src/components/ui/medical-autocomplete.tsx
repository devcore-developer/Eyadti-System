"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MedicalAutocompleteProps {
  apiUrl: string
  placeholder?: string
  onSelect: (item: any) => void
  fieldName?: string
}

export function MedicalAutocomplete({ 
  apiUrl, 
  placeholder = "Search...", 
  onSelect, 
  fieldName = "name" 
}: MedicalAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${apiUrl}?q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) {
        setResults([])
        setIsOpen(false)
        return
      }

      const data = await res.json()
      
      // API now returns pre-ranked, deduplicated results
      const items = Array.isArray(data) ? data : []
      
      setResults(items)
      setIsOpen(items.length > 0)
      setHighlightedIndex(-1)
    } catch (error) {
      console.error("MedicalAutocomplete fetch error:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      fetchResults(value)
    }, 300)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "Enter" && query.trim().length >= 2) {
        e.preventDefault()
        handleSelect({ name: query.trim() })
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex])
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const handleSelect = (item: any) => {
    const selectedName = item.name || item[fieldName] || ""
    setQuery(selectedName)
    setIsOpen(false)
    onSelect(item)
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 2 && results.length > 0) setIsOpen(true)
          }}
          className="w-full pl-10 pr-9 px-4 py-2 rounded-xl border dark:bg-[#1D2A3B] dark:border-[rgba(255,255,255,0.06)] focus:ring-2 focus:ring-[#6B9CFF] outline-none"
          placeholder={placeholder}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : query ? (
            <button
              type="button"
              onClick={() => { setQuery(""); setIsOpen(false); setResults([]) }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] mt-1 w-full max-h-60 overflow-auto rounded-xl border-2 border-[#6B9CFF] bg-white dark:bg-[#223247] shadow-2xl"
        >
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 border-b border-border/30">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </div>
          <div className="py-1">
            {results.map((item, index) => (
              <button
                type="button"
                key={item.id || item.name}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm flex justify-between items-center text-foreground transition-colors",
                  index === highlightedIndex
                    ? "bg-[#6B9CFF]/10"
                    : "hover:bg-[#6B9CFF]/5"
                )}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="font-medium">{item.name}</span>
                {item.category && <span className="text-xs text-muted-foreground ml-2">{item.category}</span>}
                {item.specialty && <span className="text-xs text-muted-foreground ml-2">{item.specialty}</span>}
                {item.icd10Code && <span className="text-xs text-[#5BC0BE] ml-2">{item.icd10Code}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}