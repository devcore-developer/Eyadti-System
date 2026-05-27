"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils" // تأكد إن عندك utils.ts اللي فيه دالة cn

interface AutocompleteProps {
  endpoint: string
  placeholder?: string
  displayField: string
  onSelect: (item: any) => void
}

export function AutocompleteSearch({
  endpoint,
  placeholder = "Search...",
  displayField,
  onSelect,
}: AutocompleteProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // دالة البحث مع Debounce
  const fetchResults = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setResults(data)
      setIsOpen(data.length > 0)
      setHighlightedIndex(-1)
    } catch (error) {
      console.error("Autocomplete fetch error:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [endpoint])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // مسح الـ Timer القديم وإنشاء واحد جديد (Debounce)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      fetchResults(value)
    }, 300) // سيبحث بعد توقف المستخدم عن الكتابة لمدة 300 ميلي ثانية
  }

  // إغلاق القائمة عند الضغط خارجها
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

  // التنقل بالكيبورد (Arrow Up/Down, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return

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
    setQuery(item[displayField])
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
          className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 2 && results.length > 0) setIsOpen(true)
          }}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* القائمة المنسدلة */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {results.length === 0 && !isLoading ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No results found.</div>
          ) : (
            results.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                  index === highlightedIndex && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {/* عرض الحقل الأساسي */}
                {item[displayField]}
                
                {/* عرض الـ Generic Name بجانب الـ Trade Name للأدوية */}
                {displayField === "tradeName" && item.genericName && (
                  <span className="text-muted-foreground ml-1 text-xs">({item.genericName})</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}