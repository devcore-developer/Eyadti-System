"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Search, X } from "lucide-react"

interface MedicalAutocompleteProps {
  apiUrl: string
  placeholder?: string
  onSelect: (item: any) => void
  fieldName?: string
}

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

function rankResult(name: string, query: string): number {
  const n = normalize(name)
  const q = normalize(query)

  if (n === q) return 100
  if (n.startsWith(q)) return 80

  const words = n.split(" ")
  if (words.some(w => w.startsWith(q))) return 60

  if (n.includes(q)) return 40

  return 0
}

export function MedicalAutocomplete({ apiUrl, placeholder = "Search...", onSelect, fieldName = "name" }: MedicalAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isSelectingRef = useRef(false)

  // Click outside — dropdown is now inside wrapper, same as working AutocompleteInput
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Search + rank + deduplicate
  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false
      return
    }

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
          const ranked = data
            .map((item: any) => ({
              ...item,
              _rank: rankResult(item.name || "", query)
            }))
            .filter((item: any) => item._rank > 0)
            .sort((a: any, b: any) => {
              if (b._rank !== a._rank) return b._rank - a._rank
              return (a.name || "").localeCompare(b.name || "")
            })

          // Deduplicate by normalized name, keep highest ranked
          const seen = new Map<string, any>()
          for (const item of ranked) {
            const key = normalize(item.name || "")
            if (!seen.has(key)) seen.set(key, item)
          }

          const deduped = Array.from(seen.values()).slice(0, 10)

          setResults(deduped)
          setIsOpen(deduped.length > 0)
          setHighlightIndex(-1)
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

  function handleSelect(item: any) {
    isSelectingRef.current = true
    const selectedName = item.name || item[fieldName] || ""
    setQuery(selectedName)
    setResults([])
    setIsOpen(false)
    onSelect(item)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "Enter" && query.trim().length >= 2) {
        e.preventDefault()
        // Treat as custom add
        handleSelect({ name: query.trim() })
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightIndex((prev) => (prev + 1) % results.length)
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightIndex((prev) => (prev - 1 + results.length) % results.length)
        break
      case "Enter":
        e.preventDefault()
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          handleSelect(results[highlightIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        setHighlightIndex(-1)
        break
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.children
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightIndex])

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!isOpen && e.target.value.length >= 2) setIsOpen(true)
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
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

      {/* Dropdown — rendered INLINE inside wrapper, same pattern as working AutocompleteInput */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1.5 w-full max-h-60 overflow-auto rounded-xl bg-white dark:bg-[#223247] border-2 border-[#6B9CFF] shadow-2xl"
        >
          {results.length > 0 && (
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 border-b border-border/30">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </div>
          )}
          <div className="py-1">
            {results.map((item, index) => (
              <button
                type="button"
                key={item.id || item.name}
                className={`w-full text-left px-4 py-2.5 text-sm flex justify-between items-center text-foreground transition-colors ${
                  index === highlightIndex
                    ? "bg-[#6B9CFF]/10"
                    : "hover:bg-[#6B9CFF]/5"
                }`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightIndex(index)}
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