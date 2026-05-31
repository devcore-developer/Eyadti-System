"use client"

import { useState } from "react"
import { createGalleryItem, deleteGalleryItem } from "@/actions/gallery"
import { BeforeAfterSlider } from "@/components/gallery/before-after-slider"
import { SocialShareButton } from "@/components/gallery/social-share-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, ImagePlus, Trash2, X } from "lucide-react"

interface GalleryItem {
  id: string
  beforeImageUrls: string[]
  afterImageUrls: string[]
  title?: string | null
  description?: string | null
}

interface PatientGalleryProps {
  patientId: string
  items: GalleryItem[]
  clinicLogo?: string | null
}

export function PatientGallery({ patientId, items, clinicLogo }: PatientGalleryProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [beforePreviews, setBeforePreviews] = useState<string[]>([])
  const [afterPreviews, setAfterPreviews] = useState<string[]>([])
  const [beforeFiles, setBeforeFiles] = useState<File[]>([])
  const [afterFiles, setAfterFiles] = useState<File[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    const newPreviews = newFiles.map(file => URL.createObjectURL(file))

    if (type === "before") {
      setBeforeFiles(prev => [...prev, ...newFiles])
      setBeforePreviews(prev => [...prev, ...newPreviews])
    } else {
      setAfterFiles(prev => [...prev, ...newFiles])
      setAfterPreviews(prev => [...prev, ...newPreviews])
    }
  }

  const removeFile = (index: number, type: "before" | "after") => {
    if (type === "before") {
      setBeforeFiles(prev => prev.filter((_, i) => i !== index))
      setBeforePreviews(prev => prev.filter((_, i) => i !== index))
    } else {
      setAfterFiles(prev => prev.filter((_, i) => i !== index))
      setAfterPreviews(prev => prev.filter((_, i) => i !== index))
    }
  }

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const urls = await Promise.all(files.map(async (file) => {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/upload", { method: "POST", body: formData })
      if (!response.ok) throw new Error("Failed to upload image")
      const data = await response.json()
      return data.url
    }))
    return urls
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    if (!beforeFiles.length || !afterFiles.length) {
      setError("At least one before and one after image are required")
      setIsPending(false)
      return
    }

    try {
      const [beforeUrls, afterUrls] = await Promise.all([
        uploadImages(beforeFiles),
        uploadImages(afterFiles)
      ])

      const formData = new FormData()
      // إضافة المصفوفات للـ FormData
      beforeUrls.forEach(url => formData.append("beforeImageUrls", url))
      afterUrls.forEach(url => formData.append("afterImageUrls", url))
      
      const title = (document.getElementById("title") as HTMLInputElement).value
      const description = (document.getElementById("description") as HTMLTextAreaElement).value
      
      if (title) formData.append("title", title)
      if (description) formData.append("description", description)

      const result = await createGalleryItem(patientId, formData)
      
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        (e.target as HTMLFormElement).reset()
        setBeforePreviews([])
        setAfterPreviews([])
        setBeforeFiles([])
        setAfterFiles([])
      }
    } catch (err) {
      setError("Something went wrong while uploading images.")
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteGalleryItem(id, patientId)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-[#223247] p-6 rounded-2xl border border-[rgba(148,163,184,0.1)]">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-[#5BC0BE]" />
          Add Before & After
        </h3>
        
        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Before Images</Label>
            <Input id="beforeFiles" type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, "before")} disabled={isPending} className="cursor-pointer" />
            <div className="flex flex-wrap gap-2 mt-2">
              {beforePreviews.map((src, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border group">
                  <img src={src} alt={`Before ${i+1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(i, "before")} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>After Images</Label>
            <Input id="afterFiles" type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, "after")} disabled={isPending} className="cursor-pointer" />
            <div className="flex flex-wrap gap-2 mt-2">
              {afterPreviews.map((src, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border group">
                  <img src={src} alt={`After ${i+1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(i, "after")} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Procedure Title (Optional)</Label>
          <Input id="title" name="title" placeholder="e.g. Dental Veneers" disabled={isPending} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea id="description" name="description" placeholder="Briefly describe the procedure..." rows={2} disabled={isPending} />
        </div>

        <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white hover:opacity-90 transition-opacity">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {isPending ? "Uploading..." : "Save Photos"}
        </Button>
      </form>

      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <div key={item.id} className="group relative space-y-3 border rounded-2xl p-4 bg-white dark:bg-[#223247] transition-shadow hover:shadow-lg">
              {/* بنمرر أول صورتين للـ Slider كـ Main Display */}
              <BeforeAfterSlider beforeSrc={item.beforeImageUrls[0]} afterSrc={item.afterImageUrls[0]} />
              
              <div className="px-1">
                {item.title && <h3 className="font-semibold text-foreground">{item.title}</h3>}
                {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>

              {/* تمرير المصفوفات الكاملة لزرار الشير */}
              <SocialShareButton 
                beforeSrcs={item.beforeImageUrls} 
                afterSrcs={item.afterImageUrls}
                clinicLogo={clinicLogo}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}