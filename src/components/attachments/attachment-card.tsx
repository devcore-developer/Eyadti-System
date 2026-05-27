"use client"

import { useState, useTransition } from "react"
import { deleteAttachment } from "@/lib/actions/attachments"
import { getCategoryLabel } from "@/lib/utils/attachments"
import { Button } from "@/components/ui/button"
import { FileText, Image, Download, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

type AttachmentRow = {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  category: string
  fileSize: number
  createdAt: Date | string
  uploadedBy: { id: string; name: string }
}

type Props = {
  attachment: AttachmentRow
  canDelete: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: Date | string): string {
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return "—"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d)
  } catch {
    return "—"
  }
}

const categoryColors: Record<string, string> = {
  LAB_RESULT: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-400",
  XRAY: "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/30 dark:text-purple-400",
  MRI: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/30 dark:text-violet-400",
  CT_SCAN: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-950/30 dark:text-indigo-400",
  PRESCRIPTION: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400",
  MEDICAL_REPORT: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400",
  OTHER: "bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-950/30 dark:text-gray-400",
}

export function AttachmentCard({ attachment, canDelete }: Props) {
  const [isPending, startTransition] = useTransition()
  const isImage = attachment.fileType.startsWith("image/")

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAttachment(attachment.id)
      if (result.success) {
        toast.success("File deleted")
      } else {
        toast.error(result.error || "Failed to delete")
      }
    })
  }

  return (
    <div className="group rounded-xl border border-border/50 bg-white/50 dark:bg-slate-800/50 p-4 transition-all hover:shadow-md hover:bg-white dark:hover:bg-slate-800">
      <div className="flex items-start gap-4">
        {/* Preview / Icon */}
        <div className="shrink-0">
          {isImage ? (
            <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachment.fileUrl}
                  alt={attachment.fileName}
                  className="h-full w-full object-cover"
                />
              </div>
            </a>
          ) : (
            <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                <FileText className="h-8 w-8 text-red-500" />
              </div>
            </a>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <a
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block"
              >
                {attachment.fileName}
              </a>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatFileSize(attachment.fileSize)} • Uploaded by {attachment.uploadedBy.name}
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${categoryColors[attachment.category] || categoryColors.OTHER}`}>
                {getCategoryLabel(attachment.category)}
              </span>
              <span className="text-[10px] text-muted-foreground">{formatDate(attachment.createdAt)}</span>
            </div>

            <div className="flex items-center gap-1">
              <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" download>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-primary">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </a>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}