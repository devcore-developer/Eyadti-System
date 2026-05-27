"use client"

import { useState, useEffect, useRef, useTransition, useCallback } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { Loader2, X, Search } from "lucide-react"

export type AutocompleteOption = {
  id: string
  label: string
  sublabel?: string
  detail?: string // للاضافات زي الـ dosage أو الـ form
  data?: any
}

type Props = {
  searchFn: (query: string) => Promise<AutocompleteOption[]>
  onSelect: (option: AutocompleteOption) => void
  placeholder?: string
  icon?: React.ReactNode
  allowCustom?: boolean
  onCustomAdd?: (value: string) => void
}

export function AutocompleteInput({
  searchFn,
  onSelect,
  placeholder = "Type to search...",
  icon,
  allowCustom = true,
  onCustomAdd,
}: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<AutocompleteOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [isPending, startTransition] = useTransition()

  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLLIElement>(null)

  // Stable callback ref for searchFn
  const searchFnRef = useCallback(searchFn, [searchFn])

  // Search effect
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    startTransition(async () => {
      const data = await searchFnRef(debouncedQuery)
      setResults(data)
      setIsOpen(data.length > 0 || allowCustom)
      setHighlightIndex(-1)
    })
  }, [debouncedQuery, searchFnRef, allowCustom])

  // Click outside
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

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: "nearest" })
    }
  }, [highlightIndex])

  function handleSelect(option: AutocompleteOption) {
    onSelect(option)
    setQuery("")
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  function handleCustomAdd() {
    if (query.trim() && onCustomAdd) {
      onCustomAdd(query.trim())
      setQuery("")
      setIsOpen(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const totalItems = results.length + (allowCustom ? 1 : 0)

    if (!isOpen) {
      if (e.key === "Enter" && allowCustom && query.trim()) {
        e.preventDefault()
        handleCustomAdd()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightIndex((prev) => (prev + 1) % totalItems)
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightIndex((prev) => (prev - 1 + totalItems) % totalItems)
        break
      case "Enter":
        e.preventDefault()
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          handleSelect(results[highlightIndex])
        } else if (highlightIndex === results.length && allowCustom) {
          handleCustomAdd()
        } else if (allowCustom && query.trim()) {
          handleCustomAdd()
        }
        break
      case "Escape":
        setIsOpen(false)
        setHighlightIndex(-1)
        break
    }
  }

  const totalItems = results.length + (allowCustom ? 1 : 0)
  const hasResults = results.length > 0

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative group">
        {icon ? (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        ) : (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="h-4 w-4" />
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!isOpen && e.target.value.length >= 2) setIsOpen(true)
          }}
          onFocus={() => {
            if (results.length > 0 || (query.length >= 2 && allowCustom)) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`h-11 w-full rounded-xl border border-input bg-white/70 dark:bg-slate-800/70 pr-9 text-sm backdrop-blur-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${icon ? 'pl-10' : 'pl-10'}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
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

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-xl shadow-black/5"
        >
          {hasResults && (
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 border-b border-border/30">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </div>
          )}

          <ul className="max-h-56 overflow-y-auto py-1 overscroll-contain">
            {results.map((option, index) => (
              <li
                key={option.id}
                ref={index === highlightIndex ? highlightRef : null}
                className={`px-3 py-2.5 cursor-pointer text-sm transition-all duration-75 ${
                  index === highlightIndex
                    ? "bg-primary/8 text-primary"
                    : "text-popover-foreground hover:bg-muted/50"
                }`}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightIndex(index)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{option.label}</div>
                    {option.sublabel && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {option.sublabel}
                      </div>
                    )}
                  </div>
                  {option.detail && (
                    <div className="shrink-0 rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {option.detail}
                    </div>
                  )}
                </div>
              </li>
            ))}

            {allowCustom && query.trim().length >= 2 && (
              <li
                ref={highlightIndex === results.length ? highlightRef : null}
                className={`px-3 py-2.5 cursor-pointer text-sm transition-all duration-75 ${
                  results.length > 0 ? "border-t border-border/30" : ""
                } ${
                  highlightIndex === results.length
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
                onClick={handleCustomAdd}
                onMouseEnter={() => setHighlightIndex(results.length)}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">+</span>
                  <span>Add custom: <span className="font-medium">&ldquo;{query.trim()}&rdquo;</span></span>
                </div>
              </li>
            )}

            {!hasResults && !allowCustom && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No results found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}