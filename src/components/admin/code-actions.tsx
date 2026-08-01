"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  revokeActivationCode,
  regenerateActivationCode,
  exportActivationCodes,
  deleteActivationCode,
} from "@/lib/actions/admin"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Ban, RefreshCw, Download, Trash2, Loader2 } from "lucide-react"

interface CodeActionsProps {
  codeId: string
  status: string
  isUsed: boolean
}

export function CodeActions({ codeId, status, isUsed }: CodeActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: string, fn: () => Promise<any>) => {
    setLoading(action)
    try {
      const result = await fn()
      if (result?.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } catch {
      alert("Something went wrong.")
    } finally {
      setLoading(null)
    }
  }

  const handleExport = async () => {
    setLoading("export")
    try {
      const result = await exportActivationCodes()
      if (result?.success && result.data) {
        const link = document.createElement("a")
        link.href = `data:${result.data.mimeType};base64,${result.data.content}`
        link.download = result.data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert(result?.error || "Failed to export codes.")
      }
    } catch {
      alert("Failed to export codes.")
    } finally {
      setLoading(null)
    }
  }

  const canModify = !isUsed && status === "AVAILABLE"
  const canDelete = !isUsed && (status === "AVAILABLE" || status === "REVOKED" || status === "EXPIRED")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button
          type="button"
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          disabled={loading !== null}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleExport} disabled={loading === "export"}>
          <Download className="mr-2 h-4 w-4" />
          {loading === "export" ? "Exporting..." : "Export All Codes (CSV)"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {canModify && (
          <DropdownMenuItem
            onClick={() =>
              handleAction("revoke", () => revokeActivationCode(codeId))
            }
            className="text-orange-600 focus:text-orange-600"
          >
            <Ban className="mr-2 h-4 w-4" />
            {loading === "revoke" ? "Revoking..." : "Revoke Code"}
          </DropdownMenuItem>
        )}

        {canModify && (
          <DropdownMenuItem
            onClick={() =>
              handleAction("regenerate", () => regenerateActivationCode(codeId))
            }
            className="text-blue-600 focus:text-blue-600"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {loading === "regenerate" ? "Regenerating..." : "Regenerate Code"}
          </DropdownMenuItem>
        )}

        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                handleAction("delete", () => deleteActivationCode(codeId))
              }
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {loading === "delete" ? "Deleting..." : "Delete Code"}
            </DropdownMenuItem>
          </>
        )}

        {isUsed && (
          <DropdownMenuItem disabled>
            <Ban className="mr-2 h-4 w-4" />
            Used codes cannot be modified
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}