"use client"

import { useState, useTransition } from "react"
import { uploadAttachment } from "@/lib/actions/attachments"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

const CATEGORIES = [
  { value: "LAB_RESULT", label: "Lab Result" },
  { value: "XRAY", label: "X-Ray" },
  { value: "MRI", label: "MRI" },
  { value: "CT_SCAN", label: "CT Scan" },
  { value: "PRESCRIPTION", label: "Prescription" },
  { value: "MEDICAL_REPORT", label: "Medical Report" },
  { value: "OTHER", label: "Other" },
]

type Props = {
  patientId: string
}

export function AttachmentUpload({ patientId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState("LAB_RESULT")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error("Please select a file")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("patientId", patientId)
    formData.append("category", category)

    startTransition(async () => {
      const result = await uploadAttachment(formData)
      if (result.success) {
        toast.success("File uploaded successfully")
        setFile(null)
        setIsOpen(false)
      } else {
        toast.error(result.error || "Upload failed")
      }
    })
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20 hover:shadow-teal-500/40 transition-all"
      >
        <Upload className="h-4 w-4" /> Upload File
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border/50">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">Upload Medical File</h3>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category <span className="text-red-500">*</span></label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* File Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">File <span className="text-red-500">*</span></label>
                <div className="rounded-lg border-2 border-dashed border-border/50 p-6 text-center hover:border-primary/50 transition-colors">
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button type="button" onClick={() => setFile(null)} className="text-muted-foreground hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-2 text-sm text-muted-foreground">Click to select file</p>
                      <p className="text-xs text-muted-foreground/60">PDF, JPG, PNG (max 10MB)</p>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isPending || !file}
                  className="flex-1 gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                >
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="h-4 w-4" /> Upload</>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}