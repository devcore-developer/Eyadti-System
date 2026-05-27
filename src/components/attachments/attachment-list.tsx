import { AttachmentCard } from "./attachment-card"
import { getCategoryLabel } from "@/lib/utils/attachments"
import { FileText } from "lucide-react"

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
  attachments: AttachmentRow[]
  canDelete: boolean
}

export function AttachmentList({ attachments, canDelete }: Props) {
  if (attachments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileText className="mb-3 h-12 w-12 opacity-20" />
        <p className="text-sm">No medical files uploaded yet.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {attachments.map((attachment) => (
        <AttachmentCard
          key={attachment.id}
          attachment={attachment}
          canDelete={canDelete}
        />
      ))}
    </div>
  )
}