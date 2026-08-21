"use client"

import { useState } from "react"
import { Globe, ExternalLink, Copy, Check } from "lucide-react"

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement("textarea")
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-2.5 bg-white border-2 border-teal-300 text-teal-700 rounded-xl hover:bg-teal-50 hover:border-teal-400 transition-all font-medium text-sm shadow-sm"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-600">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

export function OnlineBookingUrlCard({ url }: { url: string }) {
  return (
    <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-teal-800">Public Booking Page</p>
          <p className="text-xs text-teal-600 mt-0.5">Share this link with patients to book appointments online</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-teal-300 text-teal-700 rounded-xl hover:bg-teal-50 hover:border-teal-400 transition-all font-medium text-sm shadow-sm"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Open Page</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <CopyButton url={url} />
        </div>
      </div>
      <div className="mt-3 bg-white/70 rounded-lg p-3 border border-teal-100">
        <p className="text-[11px] text-teal-600 font-mono break-all select-all">{url}</p>
      </div>
    </div>
  )
}