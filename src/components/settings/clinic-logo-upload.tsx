// src/components/settings/clinic-logo-upload.tsx

"use client"

import { useState, useRef } from "react"
import { uploadClinicLogo, deleteClinicLogo } from "@/lib/actions/settings"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Trash2, Loader2, ImagePlus } from "lucide-react"
import Image from "next/image"

interface ClinicLogoUploadProps {
  clinicId: string
  logoUrl: string | null
  isReadOnly: boolean
}

export function ClinicLogoUpload({ clinicId, logoUrl, isReadOnly }: ClinicLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [preview, setPreview] = useState(logoUrl || null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("logo", file)

    const result = await uploadClinicLogo(clinicId, formData)
    if (result.success && result.url) {
      setPreview(result.url || null)
      alert("Logo updated successfully!")
    } else {
      alert(result.error || "Upload failed")
    }
    setIsUploading(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteClinicLogo(clinicId)
    if (result.success) {
      setPreview(null)
      alert("Logo removed successfully!")
    } else {
      alert("Failed to remove logo")
    }
    setIsDeleting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinic Logo</CardTitle>
        <CardDescription>This logo will appear on prescriptions, invoices, and print pages.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
            {preview ? (
              <Image src={preview} alt="Clinic Logo" fill className="object-contain p-2" />
            ) : (
              <ImagePlus className="h-10 w-10 text-gray-300" />
            )}
          </div>

          {!isReadOnly && (
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {preview ? "Replace Logo" : "Upload Logo"}
              </Button>

              {preview && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Remove
                </Button>
              )}
              <p className="text-[10px] text-muted-foreground">PNG, JPG, WebP. Max 2MB.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}