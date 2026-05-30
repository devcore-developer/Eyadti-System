"use client"

import { useState } from "react"
import { createGalleryItem, deleteGalleryItem } from "@/actions/gallery"
import { BeforeAfterSlider } from "@/components/gallery/before-after-slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, ImagePlus, Trash2 } from "lucide-react"

interface PatientGalleryProps {
  patientId: string
  items: any[]
}

export function PatientGallery({ patientId, items }: PatientGalleryProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [beforePreview, setBeforePreview] = useState<string | null>(null)
  const [afterPreview, setAfterPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === "before") setBeforePreview(reader.result as string)
        else setAfterPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch("/api/upload", { method: "POST", body: formData })
    if (!response.ok) throw new Error("Failed to upload image")
    const data = await response.json()
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    try {
      const beforeFile = (document.getElementById("beforeFile") as HTMLInputElement).files?.[0]
      const afterFile = (document.getElementById("afterFile") as HTMLInputElement).files?.[0]

      if (!beforeFile || !afterFile) {
        setError("Both before and after images are required")
        setIsPending(false)
        return
      }

      const [beforeUrl, afterUrl] = await Promise.all([
        uploadImage(beforeFile),
        uploadImage(afterFile)
      ])

      formData.set("beforeImageUrl", beforeUrl)
      formData.set("afterImageUrl", afterUrl)

      const result = await createGalleryItem(patientId, formData)
      if (result.error) setError(result.error)
      
      if (result.success) {
        (e.target as HTMLFormElement).reset()
        setBeforePreview(null)
        setAfterPreview(null)
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
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-[#223247] p-6 rounded-2xl border border-[rgba(148,163,184,0.1)]">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-[#5BC0BE]" />
          Add Before & After
        </h3>
        
        {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Before Image</Label>
            <Input id="beforeFile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, "before")} disabled={isPending} />
            {beforePreview && <div className="mt-2 h-24 w-full rounded-lg overflow-hidden bg-muted"><img src={beforePreview} alt="Before" className="w-full h-full object-cover" /></div>}
          </div>
          <div className="space-y-2">
            <Label>After Image</Label>
            <Input id="afterFile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, "after")} disabled={isPending} />
            {afterPreview && <div className="mt-2 h-24 w-full rounded-lg overflow-hidden bg-muted"><img src={afterPreview} alt="After" className="w-full h-full object-cover" /></div>}
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

        <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Save Photos
        </Button>
      </form>

      {/* Gallery Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <div key={item.id} className="group relative space-y-3 border rounded-2xl p-4 bg-white dark:bg-[#223247]">
              <BeforeAfterSlider beforeSrc={item.beforeImageUrl} afterSrc={item.afterImageUrl} />
              
              <div className="px-1">
                {item.title && <h3 className="font-semibold text-foreground">{item.title}</h3>}
                {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
              </div>

              <Button 
                variant="destructive" 
                size="sm" 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}