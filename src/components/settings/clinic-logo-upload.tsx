"use client"

import { useState, useRef } from "react"
import { uploadClinicLogo, deleteClinicLogo } from "@/lib/actions/settings"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Trash2, Loader2, ImagePlus } from "lucide-react"

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

    try {
      const result = await uploadClinicLogo(clinicId, formData)
      if (result.success && result.url) {
        setPreview(result.url)
        // مسح قيمة الـ input عشان يقدر يختار نفس الملف تاني لو عايز
        if (fileInputRef.current) fileInputRef.current.value = ""
      } else {
        alert(result.error || "Upload failed")
      }
    } catch (error) {
      alert("Something went wrong")
    }
    setIsUploading(false)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove the clinic logo?")) return
    
    setIsDeleting(true)
    try {
      const result = await deleteClinicLogo(clinicId)
      if (result.success) {
        setPreview(null)
      } else {
        alert(result.error || "Failed to remove logo")
      }
    } catch (error) {
      alert("Something went wrong")
    }
    setIsDeleting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinic Logo</CardTitle>
        <CardDescription>This logo will appear on prescriptions, invoices, and the Before & After share design.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 overflow-hidden">
            {preview ? (
              // استخدام img عادي عشان Next.js Image بتعمل مشاكل مع روابط Cloudinary لو متضافهوش في الكونفق
              <img src={preview} alt="Clinic Logo" className="w-full h-full object-contain p-2" />
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