"use client"

import { useState } from "react"

export function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 p-2 bg-white dark:bg-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
    >
      <span className="text-xs font-medium">
        {copied ? "✓ Copied" : "Copy"}
      </span>
    </button>
  )
}