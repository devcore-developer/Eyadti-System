"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, EyeOff, Star, CheckCircle2, Image as ImageIcon, MessageSquareQuote } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Testimonial {
  id: string
  name: string
  clinicName: string
  position?: string | null
  photoUrl?: string | null
  review: string
  rating: number
  isPublished: boolean
  displayOrder: number
  createdAt: string
  createdByUser?: { id: string; name: string; email: string } | null
}

export default function TestimonialsManagementPage() {
  const router = useRouter()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<Testimonial | null>(null)
  const [deleteItem, setDeleteItem] = useState<Testimonial | null>(null)

  const loadTestimonials = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/testimonials")
      if (res.ok) {
        const data = await res.json()
        setTestimonials(data)
      }
    } catch (error) {
      console.error("Failed to load testimonials:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTestimonials() }, [loadTestimonials])

  const handlePublishToggle = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch("/api/super-admin/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isPublished: !currentState }),
      })
      if (res.ok) loadTestimonials()
    } catch (error) {
      console.error("Failed to toggle publish:", error)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      const res = await fetch(`/api/super-admin/testimonials?id=${deleteItem.id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteItem(null)
        loadTestimonials()
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const handleEdit = (item: Testimonial) => {
    setEditItem(item)
    setIsCreateOpen(false)
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading testimonials...</div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {testimonials.length} testimonials total ({testimonials.filter(t => t.isPublished).length} published)
          </p>
        </div>
        {/* ⭐ modal={false} ده الحل الأساسي لمشكلة الـ Select */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4 mr-2" /> Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
            </DialogHeader>
            <TestimonialForm
              testimonial={editItem}
              onSuccess={() => {
                setIsCreateOpen(false)
                setEditItem(null)
                loadTestimonials()
              }}
              onCancel={() => {
                setIsCreateOpen(false)
                setEditItem(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Testimonials List */}
      {testimonials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-semibold text-muted-foreground">No testimonials yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Add your first testimonial to display on the landing page.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => (
            <Card key={t.id} className={cn("transition-all", !t.isPublished && "opacity-60")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    {t.photoUrl ? (
                      <img src={t.photoUrl} alt={t.name} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-[#5BC0BE] to-[#6B9CFF] text-white text-sm font-bold">
                        {t.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.clinicName}{t.position ? ` · ${t.position}` : ""}</p>
                      </div>
                      <Badge
                        variant={t.isPublished ? "default" : "secondary"}
                        className={cn(
                          "text-[10px] font-bold",
                          t.isPublished ? "bg-[#6BCB77]/10 text-[#6BCB77] border-[#6BCB77]/20" : "bg-slate-100 text-slate-500 border-slate-200"
                        )}
                      >
                        {t.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>

                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("h-3.5 w-3.5", i < t.rating ? "fill-[#F4B860] text-[#F4B860]" : "fill-muted text-muted")} />
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      &ldquo;{t.review}&rdquo;
                    </p>

                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      {t.createdByUser && <span>by {t.createdByUser.name}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePublishToggle(t.id, t.isPublished)}
                      title={t.isPublished ? "Unpublish" : "Publish"}
                    >
                      {t.isPublished ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <CheckCircle2 className="h-4 w-4 text-[#6BCB77]" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(t)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteItem(t)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteItem && (
        <Dialog open onOpenChange={(open) => !open && setDeleteItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Testimonial</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                <p className="text-sm text-red-700 dark:text-red-400">
                  Are you sure you want to delete this testimonial? This action cannot be undone.
                </p>
                <div className="mt-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium">{deleteItem.name} — {deleteItem.clinicName}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{deleteItem.review}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteItem(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ─── Testimonial Form ──────────────────────────────

function TestimonialForm({
  testimonial,
  onSuccess,
  onCancel
}: {
  testimonial?: Testimonial | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    name: testimonial?.name ?? "",
    clinicName: testimonial?.clinicName ?? "",
    position: testimonial?.position ?? "",
    photoUrl: testimonial?.photoUrl ?? "",
    review: testimonial?.review ?? "",
    rating: testimonial?.rating ?? 5,
    isPublished: testimonial?.isPublished ?? false,
    displayOrder: testimonial?.displayOrder ?? 0,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // ⭐ بناء الـ payload يدوياً عشان نضمن الأنواع صح
    const payload = {
      name: String(formData.name).trim(),
      clinicName: String(formData.clinicName).trim(),
      position: formData.position ? String(formData.position).trim() : null,
      photoUrl: formData.photoUrl ? String(formData.photoUrl).trim() : null,
      review: String(formData.review).trim(),
      rating: Number(formData.rating) || 5,
      isPublished: Boolean(formData.isPublished),
      displayOrder: Number(formData.displayOrder) || 0,
    }

    // ⭐ Validation قبل الإرسال
    if (!payload.name || !payload.clinicName || !payload.review) {
      alert("Name, clinic name, and review are required.")
      return
    }

    if (payload.rating < 1 || payload.rating > 5) {
      alert("Rating must be between 1 and 5.")
      return
    }

    startTransition(async () => {
      try {
        const url = "/api/super-admin/testimonials"
        const method = testimonial?.id ? "PUT" : "POST"
        const body = testimonial?.id ? { id: testimonial.id, ...payload } : payload

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (res.ok) {
          onSuccess()
        } else {
          const data = await res.json()
          alert(data.error || "Something went wrong")
        }
      } catch (error) {
        console.error("Failed to save testimonial:", error)
        alert("Network error. Please try again.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Dr. Ahmed Hassan" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clinicName">Clinic Name *</Label>
          <Input id="clinicName" name="clinicName" value={formData.clinicName} onChange={handleChange} placeholder="Al Hayat Medical Center" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Position (Optional)</Label>
          <Input id="position" name="position" value={formData.position} onChange={handleChange} placeholder="Chief Dentist" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="photoUrl">Photo URL (Optional)</Label>
          <Input id="photoUrl" name="photoUrl" value={formData.photoUrl} onChange={handleChange} placeholder="https://example.com/photo.jpg" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review">Review *</Label>
        <Textarea
          id="review"
          name="review"
          value={formData.review}
          onChange={handleChange}
          placeholder="Nexora transformed how we manage our clinic. The appointment scheduling is incredibly smooth..."
          rows={4}
          required
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ⭐ Rating Select */}
        <div className="space-y-2">
          <Label>Rating *</Label>
          <Select
            value={String(formData.rating)}
            onValueChange={(val) => setFormData(prev => ({ ...prev, rating: parseInt(val ?? "5") }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent className="z-[100]">
              {[5, 4, 3, 2, 1].map(r => (
                <SelectItem key={r} value={String(r)}>
                  <span className="flex items-center gap-1">
                    {Array.from({ length: r }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-[#F4B860] text-[#F4B860]" />
                    ))}
                    <span className="ml-1">{r}/5</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            name="displayOrder"
            type="number"
            min={0}
            value={formData.displayOrder}
            onChange={handleChange}
            placeholder="0 = first"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer pt-7">
            <input
              id="isPublished"
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="h-4 w-4 rounded border border-input"
            />
            <span className="text-sm font-medium">Publish immediately</span>
          </label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white">
          {isPending ? "Saving..." : testimonial?.id ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  )
}