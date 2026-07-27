"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ConfirmDelete } from "@/components/shared/confirm-delete"
import { Megaphone, Plus, Info, AlertTriangle, XCircle, Calendar, Target, Pencil, Trash2, CheckCircle2, Archive } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { createAnnouncement, updateAnnouncement, deleteAnnouncement, archiveAnnouncement, getAnnouncements, getClinicsForSelect, getAllPlans } from "@/lib/actions/super-admin"

type AnnouncementType = "INFO" | "WARNING" | "CRITICAL"
type TargetMode = "ALL" | "CLINICS" | "PLANS"

interface Announcement {
  id: string; title: string; message: string; type: AnnouncementType
  targetAll: boolean; targetClinicIds: string[]; targetPlanIds: string[]
  startsAt: Date; endsAt: Date | null; createdByUser: { name: string } | null
}

interface AnnouncementsCenterProps {
  isDialogOpen?: boolean
  onDialogChange?: (open: boolean) => void
  initialAnnouncements?: Announcement[]
}

const typeConfig: Record<AnnouncementType, { icon: any; color: string; bg: string; border: string; activeBg: string; activeBorder: string }> = {
  INFO: { icon: Info, color: "text-[#6B9CFF]", bg: "bg-[#6B9CFF]/10", border: "border-[#6B9CFF]/20", activeBg: "bg-[#6B9CFF] text-white", activeBorder: "border-[#6B9CFF]" },
  WARNING: { icon: AlertTriangle, color: "text-[#F4B860]", bg: "bg-[#F4B860]/10", border: "border-[#F4B860]/20", activeBg: "bg-[#F4B860] text-white", activeBorder: "border-[#F4B860]" },
  CRITICAL: { icon: XCircle, color: "text-[#EF6B6B]", bg: "bg-[#EF6B6B]/10", border: "border-[#EF6B6B]/20", activeBg: "bg-[#EF6B6B] text-white", activeBorder: "border-[#EF6B6B]" }
}

export function AnnouncementsCenter({ isDialogOpen, onDialogChange, initialAnnouncements = [] }: AnnouncementsCenterProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState<AnnouncementType>("INFO")
  const [targetMode, setTargetMode] = useState<TargetMode>("ALL")
  const [selectedClinics, setSelectedClinics] = useState<string[]>([])
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [clinicSearch, setClinicSearch] = useState("") // إصلاح مشكلة البحث
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([])
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([])

  useEffect(() => { setIsOpen(isDialogOpen || false) }, [isDialogOpen])
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onDialogChange?.(open)
    if (!open) resetForm()
  }

  const resetForm = () => {
    setTitle(""); setMessage(""); setType("INFO"); setTargetMode("ALL")
    setSelectedClinics([]); setSelectedPlans([]); setErrors({}); setEditingId(null); setClinicSearch("")
  }

  const openForEdit = (a: Announcement) => {
    setEditingId(a.id); setTitle(a.title); setMessage(a.message); setType(a.type)
    setTargetMode(a.targetAll ? "ALL" : a.targetClinicIds.length > 0 ? "CLINICS" : "PLANS")
    setSelectedClinics(a.targetClinicIds || []); setSelectedPlans(a.targetPlanIds || []); setIsOpen(true)
  }

  const loadDependencies = async () => {
    if (targetMode === "CLINICS" && clinics.length === 0) {
      const data = await getClinicsForSelect(); setClinics(data)
    }
    if (targetMode === "PLANS" && plans.length === 0) {
      const data = await getAllPlans(); setPlans(data.map((p: any) => ({ id: p.id, name: p.name })))
    }
  }

  useEffect(() => { loadDependencies() }, [targetMode])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = "Title is required"
    if (!message.trim()) e.message = "Message is required"
    if (targetMode === "CLINICS" && selectedClinics.length === 0) e.target = "Select at least one clinic"
    if (targetMode === "PLANS" && selectedPlans.length === 0) e.target = "Select at least one plan"
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    const payload = { title, message, type, targetAll: targetMode === "ALL", targetClinicIds: selectedClinics, targetPlanIds: selectedPlans }
    const res = editingId ? await updateAnnouncement(editingId, payload) : await createAnnouncement(payload)
    setIsSubmitting(false)
    if (res.success) {
      const refreshed = await getAnnouncements(); setAnnouncements(refreshed)
      setTimeout(() => { setIsOpen(false) }, 800)
    } else {
      setErrors({ form: res.error || "Something went wrong" })
    }
  }

  const handleArchive = async (id: string) => {
    const res = await archiveAnnouncement(id)
    if (res.success) setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const handleDelete = async (id: string) => {
    const res = await deleteAnnouncement(id)
    if (res.success) setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const toggleSelection = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter(i => i !== id) : [...list, id])
  }

  const filteredClinics = clinics.filter(c => c.name.toLowerCase().includes(clinicSearch.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#A78BFA]/10"><Megaphone className="h-5 w-5 text-[#A78BFA]" /></div>
          <div><h3 className="text-lg font-bold">Announcements</h3><p className="text-xs text-muted-foreground">Broadcast messages to clinics</p></div>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-white shadow-[0_4px_12px_rgba(167,139,250,0.2)] hover:-translate-y-0.5 transition-all">
              <Plus className="h-4 w-4 mr-2" /> New Announcement
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[720px] min-h-[90vh] flex flex-col p-0 gap-0 rounded-3xl border-none shadow-2xl bg-background">
            {/* الهيدر - ثابت لا يتغير حجمه */}
            <div className="p-6 pb-4 border-b border-border/50 shrink-0">
              <DialogHeader className="p-0">
                <DialogTitle className="text-xl font-bold text-foreground">{editingId ? "Edit Announcement" : "Create New Announcement"}</DialogTitle>
              </DialogHeader>
            </div>
            
            {/* منطقة المحتوى - تتمدد لتملأ الفراغ المتبقي، والسكرول يشتغل هنا لو الشاشة صغيرة */}
            <div className="px-6 py-5 space-y-6 flex-1 overflow-y-auto">
              {errors.form && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#EF6B6B]/5 border border-[#EF6B6B]/20">
                  <AlertTriangle className="h-5 w-5 text-[#EF6B6B] shrink-0" />
                  <p className="text-sm font-medium text-[#EF6B6B]">{errors.form}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Title</label>
                <Input placeholder="e.g., Scheduled Maintenance" value={title} onChange={(e) => { setTitle(e.target.value); if(errors.title) setErrors(p=>{const n={...p}; delete n.title; return n;}) }} className={cn("h-11", errors.title && "border-[#EF6B6B]/50")} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Message</label>
                <Textarea placeholder="Write your message here..." rows={4} value={message} onChange={(e) => { setMessage(e.target.value); if(errors.message) setErrors(p=>{const n={...p}; delete n.message; return n;}) }} className={cn("resize-none", errors.message && "border-[#EF6B6B]/50")} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Type</label>
                <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border/50 inline-flex gap-2 w-fit">
                  {(["INFO", "WARNING", "CRITICAL"] as AnnouncementType[]).map((t) => {
                    const config = typeConfig[t]; const isActive = type === t
                    return (
                      <button key={t} type="button" onClick={() => setType(t)} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 outline-none", isActive ? config.activeBg + " border " + config.activeBorder + " shadow-sm" : "border-transparent hover:bg-background text-muted-foreground")}>
                        <config.icon className="h-4 w-4" />{t.charAt(0) + t.slice(1).toLowerCase()}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Target Audience</label>
                <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border/50 inline-flex gap-2 w-fit">
                  {[{ value: "ALL", label: "All Clinics" }, { value: "CLINICS", label: "Specific Clinics" }, { value: "PLANS", label: "Specific Plans" }].map((t) => (
                    <button key={t.value} type="button" onClick={() => { setTargetMode(t.value as TargetMode); setSelectedClinics([]); setSelectedPlans([]); setClinicSearch(""); }} className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all outline-none", targetMode === t.value ? "bg-background border border-border shadow-sm text-foreground" : "border-transparent hover:bg-background text-muted-foreground")}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {(targetMode === "CLINICS" || targetMode === "PLANS") && (
                  <div className="mt-3 border border-border/50 rounded-2xl p-4 bg-muted/20 space-y-3 max-h-48 overflow-y-auto">
                    {targetMode === "CLINICS" && (
                      <Input placeholder="Search clinics..." className="h-10" value={clinicSearch} onChange={(e) => setClinicSearch(e.target.value)} />
                    )}
                    <div className="space-y-2">
                      {(targetMode === "CLINICS" ? filteredClinics : plans).map((item) => {
                        const isSelected = targetMode === "CLINICS" ? selectedClinics.includes(item.id) : selectedPlans.includes(item.id)
                        return (
                          <label key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-background cursor-pointer transition-colors border border-transparent has-[:checked]:border-primary/30 has-[:checked]:bg-primary/5">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(item.id, targetMode === "CLINICS" ? selectedClinics : selectedPlans, targetMode === "CLINICS" ? setSelectedClinics : setSelectedPlans)} className="h-4 w-4 rounded border-border/50 text-primary accent-primary" />
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* الفوتر - ثابت نازل في الأسفل دايماً */}
            <div className="p-6 pt-4 border-t border-border/50 bg-muted/30 shrink-0">
              <div className="flex justify-end gap-3 w-full">
                <Button variant="outline" onClick={() => handleOpenChange(false)} className="rounded-xl h-11 px-6">Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-[#A78BFA] to-[#6B9CFF] text-white rounded-xl h-11 px-8 font-semibold shadow-[0_4px_12px_rgba(167,139,250,0.2)] hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-70">
                  {isSubmitting ? "Publishing..." : editingId ? "Update Announcement" : "Publish Announcement"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {announcements.length > 0 ? (
          announcements.map(a => {
            const config = typeConfig[a.type]
            return (
              <Card key={a.id} className={cn("border-none transition-all hover:shadow-md", config.bg)}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-xl shrink-0", config.bg)}><config.icon className={cn("h-5 w-5", config.color)} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-bold text-foreground">{a.title}</h4>
                        <Badge variant="outline" className={cn("text-[10px] font-semibold", config.border, config.color)}>{a.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.message}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {a.targetAll ? "All Clinics" : "Targeted"}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(a.startsAt), "MMM d, yyyy")}</span>
                        {a.createdByUser && <span>By: {a.createdByUser.name}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => openForEdit(a)} className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleArchive(a.id)} className="p-2 rounded-lg hover:bg-[#F4B860]/10 text-muted-foreground hover:text-[#F4B860] transition-colors"><Archive className="h-4 w-4" /></button>
                      <ConfirmDelete title="Delete Announcement" description="This will permanently remove the announcement." onConfirm={() => handleDelete(a.id)}>
                        <button className="p-2 rounded-lg hover:bg-[#EF6B6B]/10 text-muted-foreground hover:text-[#EF6B6B] transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </ConfirmDelete>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="premium-card p-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-muted-foreground">No Announcements Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first platform broadcast.</p>
          </div>
        )}
      </div>
    </div>
  )
}