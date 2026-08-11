"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createGalleryItem } from "@/actions/gallery"
import { showSuccess, showError } from "@/components/shared/feedback-toast"
import { Plus, Lock, ImagePlus, Trash2 } from "lucide-react"

type GalleryItem = {
  id: string
  title: string | null
  beforeImageUrls: string[]
  afterImageUrls: string[]
}

interface PatientGalleryProps {
  patientId: string
  initialItems?: GalleryItem[]
  hasGalleryAccess: boolean // ✅ يتم تمريرها من الـ Server Component
}

export function PatientGallery({ patientId, initialItems = [], hasGalleryAccess }: PatientGalleryProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems)
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [beforeUrls, setBeforeUrls] = useState<string[]>([])
  const [afterUrls, setAfterUrls] = useState<string[]>([])

  // ✅ حالة عدم وجود صلاحية (بدلاً من إخفاء التبويب بالكامل نعرض رسالة تسويقية)
  if (!hasGalleryAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-[24px] border border-dashed border-muted-foreground/20 bg-muted/5">
        <div className="p-4 rounded-full bg-[#6B9CFF]/10 mb-4">
          <Lock className="h-8 w-8 text-[#6B9CFF]" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Before & After Gallery</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Showcase your procedures with before and after photos. Track patient progress visually.
        </p>
        <Link href="/settings/billing">
          <Button className="gap-2 bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-md hover:-translate-y-0.5 transition-all">
            Upgrade to Professional
          </Button>
        </Link>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (beforeUrls.length === 0 && afterUrls.length === 0) {
      showError("Images Required", "Please upload at least one before or after image.")
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.set("patientId", patientId)
    formData.set("beforeImageUrls", JSON.stringify(beforeUrls))
    formData.set("afterImageUrls", JSON.stringify(afterUrls))

    startTransition(async () => {
      const result = await createGalleryItem(formData)
      if (result.success) {
        showSuccess("Success", "Gallery item added successfully")
        setOpen(false)
        // ملاحظة: في بيئة حقيقية يجب إعادة جلب البيانات أو تحديث الـ cache هنا
      } else {
        showError("Failed", result.error || "Could not add gallery item")
      }
    })
  }

  // مكون مبسط لإضافة الصور (بفرض أنك تستخدم رفع ملفات يرجع URL)
  const handleMockUpload = (type: "before" | "after") => {
    const mockUrl = `https://placehold.co/600x400/E2E8F0/475569?text=Image+${Math.random().toString().slice(2, 6)}`
    if (type === "before") setBeforeUrls([...beforeUrls, mockUrl])
    else setAfterUrls([...afterUrls, mockUrl])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Gallery</h3>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 rounded-xl bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white shadow-md">
              <ImagePlus className="h-4 w-4" /> Add Before & After
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Before & After Photos</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input name="title" placeholder="e.g., Teeth Whitening" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input name="description" placeholder="Optional notes" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 border rounded-xl">
                  <Label className="text-red-500 font-semibold">Before Photos</Label>
                  <div className="flex flex-wrap gap-2">
                    {beforeUrls.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                        <img src={url} alt="before" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleMockUpload("before")} className="w-full border-dashed">
                    <Plus className="h-4 w-4 mr-2" /> Upload Before
                  </Button>
                </div>

                <div className="space-y-3 p-4 border rounded-xl">
                  <Label className="text-green-500 font-semibold">After Photos</Label>
                  <div className="flex flex-wrap gap-2">
                    {afterUrls.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                        <img src={url} alt="after" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleMockUpload("after")} className="w-full border-dashed">
                    <Plus className="h-4 w-4 mr-2" /> Upload After
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Gallery Item"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-2xl text-muted-foreground">
          No gallery items yet. Click "Add Before & After" to start.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="border rounded-2xl p-4 space-y-3 hover:shadow-md transition-shadow">
              <h4 className="font-medium text-sm">{item.title || "Untitled Procedure"}</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square bg-red-50 rounded-lg flex items-center justify-center text-xs text-red-400">
                  Before ({item.beforeImageUrls.length})
                </div>
                <div className="aspect-square bg-green-50 rounded-lg flex items-center justify-center text-xs text-green-400">
                  After ({item.afterImageUrls.length})
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}