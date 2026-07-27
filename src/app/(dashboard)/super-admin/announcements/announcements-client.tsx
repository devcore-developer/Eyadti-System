"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ConfirmDelete } from "@/components/shared/confirm-delete"
import { AnnouncementsCenter } from "@/components/super-admin/announcements-center"
import { Info, AlertTriangle, XCircle, Eye, Archive, RotateCcw, Pencil, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { archiveAnnouncement, restoreAnnouncement, deleteAnnouncement, getAnnouncementStats } from "@/lib/actions/super-admin"

const typeConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  INFO: { icon: Info, color: "text-[#6B9CFF]", bg: "bg-[#6B9CFF]/10", border: "border-[#6B9CFF]/30" },
  WARNING: { icon: AlertTriangle, color: "text-[#F4B860]", bg: "bg-[#F4B860]/10", border: "border-[#F4B860]/30" },
  CRITICAL: { icon: XCircle, color: "text-[#EF6B6B]", bg: "bg-[#EF6B6B]/10", border: "border-[#EF6B6B]/30" }
}

export function AnnouncementsManagementClient({ initialAnnouncements }: { initialAnnouncements: any[] }) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [stats, setStats] = useState<any>(null)

  const filteredAnnouncements = announcements.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "ALL" || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const openDetails = async (a: any) => {
    setSelectedAnnouncement(a)
    setIsDrawerOpen(true)
    const data = await getAnnouncementStats(a.id)
    setStats(data)
  }

  const handleAction = async (id: string, action: "archive" | "restore" | "delete") => {
    let res
    if (action === "archive") res = await archiveAnnouncement(id)
    if (action === "restore") res = await restoreAnnouncement(id)
    if (action === "delete") res = await deleteAnnouncement(id)
    
    if (res?.success) {
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      setIsDrawerOpen(false)
    }
  }

  return (
    <>
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search announcements..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["ALL", "ACTIVE", "ARCHIVED"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="rounded-lg text-xs">
              {s}
            </Button>
          ))}
          <Button className="bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-white" onClick={() => setIsCreateOpen(true)}>New</Button>
        </div>
      </div>

      {/* Reusing the Create Dialog */}
      <AnnouncementsCenter isDialogOpen={isCreateOpen} onDialogChange={setIsCreateOpen} />

      {/* Table/Cards List */}
      <div className="space-y-3">
        {filteredAnnouncements.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-border/50">
            <p className="text-muted-foreground font-medium">No announcements found</p>
          </Card>
        ) : (
          filteredAnnouncements.map(a => {
            const config = typeConfig[a.type] || typeConfig.INFO
            const Icon = config.icon
            return (
              <Card key={a.id} className="premium-card border-none hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("p-2.5 rounded-xl", config.bg)}>
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold truncate">{a.title}</h3>
                      <Badge variant="outline" className={cn("text-[10px] shrink-0", config.border, config.color)}>{a.type}</Badge>
                      <Badge variant={a.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] shrink-0">{a.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{a.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(a.createdAt), "MMM d, yyyy")} · {a.createdByUser?.name}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetails(a)}><Eye className="h-4 w-4" /></Button>
                    {a.status === "ACTIVE" && <Button variant="ghost" size="icon" className="h-8 w-8 text-[#F4B860]" onClick={() => handleAction(a.id, 'archive')}><Archive className="h-4 w-4" /></Button>}
                    {a.status === "ARCHIVED" && <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6BCB77]" onClick={() => handleAction(a.id, 'restore')}><RotateCcw className="h-4 w-4" /></Button>}
                    <ConfirmDelete title="Delete Permanently?" description="This will remove it from all clinics." onConfirm={() => handleAction(a.id, 'delete')}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#EF6B6B] hover:text-[#EF6B6B]"><XCircle className="h-4 w-4" /></Button>
                    </ConfirmDelete>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Details Drawer (Step 6) */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 overflow-y-auto">
          {selectedAnnouncement && (
            <div className="p-6 space-y-6">
              <SheetHeader>
                <SheetTitle className="text-left text-xl">{selectedAnnouncement.title}</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant="outline" className={cn(typeConfig[selectedAnnouncement.type]?.border, typeConfig[selectedAnnouncement.type]?.color)}>{selectedAnnouncement.type}</Badge>
                  <Badge variant="default">{selectedAnnouncement.status}</Badge>
                </div>

                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedAnnouncement.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-muted-foreground">Target</p><p className="font-medium mt-1">{selectedAnnouncement.targetAll ? "All Clinics" : "Targeted"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Created By</p><p className="font-medium mt-1">{selectedAnnouncement.createdByUser?.name || "System"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Created At</p><p className="font-medium mt-1">{format(new Date(selectedAnnouncement.createdAt), "PPP")}</p></div>
                  <div><p className="text-xs text-muted-foreground">Last Updated</p><p className="font-medium mt-1">{format(new Date(selectedAnnouncement.updatedAt), "PPP")}</p></div>
                </div>

                {/* Read Stats (Step 4) */}
                {stats && (
                  <div className="p-4 rounded-xl border border-border/50 bg-[#6B9CFF]/5">
                    <p className="text-xs font-bold text-[#6B9CFF] uppercase mb-3">Read Statistics</p>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-2xl font-extrabold text-foreground">{stats.readCount}</p>
                        <p className="text-[10px] text-muted-foreground">Read Clinics</p>
                      </div>
                      <div className="h-10 w-px bg-border" />
                      <div className="text-center">
                        <p className="text-2xl font-extrabold text-foreground">{stats.unreadCount}</p>
                        <p className="text-[10px] text-muted-foreground">Unread Clinics</p>
                      </div>
                      <div className="h-10 w-px bg-border" />
                      <div className="text-center">
                        <p className="text-2xl font-extrabold text-foreground">{stats.totalClinics}</p>
                        <p className="text-[10px] text-muted-foreground">Total Active</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}