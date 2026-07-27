"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Megaphone, Plus, Info, AlertTriangle, XCircle, Calendar, Target, Eye
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

const typeConfig = {
  INFO: { icon: Info, color: "text-[#6B9CFF]", bg: "bg-[#6B9CFF]/10", border: "border-[#6B9CFF]/20" },
  WARNING: { icon: AlertTriangle, color: "text-[#F4B860]", bg: "bg-[#F4B860]/10", border: "border-[#F4B860]/20" },
  CRITICAL: { icon: XCircle, color: "text-[#EF6B6B]", bg: "bg-[#EF6B6B]/10", border: "border-[#EF6B6B]/20" }
}

export function AnnouncementsCenter() {
  const [isOpen, setIsOpen] = useState(false)
  // In a real app, you'd fetch announcements via SWR or pass as props
  const mockAnnouncements = [
    { id: '1', title: "Scheduled Maintenance", message: "System downtime on Friday 11 PM.", type: "WARNING" as const, target: "All Clinics", startsAt: new Date(), isDismissible: true },
    { id: '2', title: "New AI Features", message: "AI Diagnosis assistant is now available for Enterprise plans.", type: "INFO" as const, target: "Enterprise Plan", startsAt: new Date(), isDismissible: false }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#A78BFA]/10">
            <Megaphone className="h-5 w-5 text-[#A78BFA]" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Announcements</h3>
            <p className="text-xs text-muted-foreground">Broadcast messages to clinics</p>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-white">
              <Plus className="h-4 w-4 mr-2" /> New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Announcement Title" />
              <Textarea placeholder="Write your message here..." rows={4} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                  <div className="flex gap-2">
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <button key={key} className={cn("p-2 rounded-lg border text-xs font-medium", config.border, config.color)}>
                        <config.icon className="h-4 w-4 mx-auto mb-1" />
                        {key.charAt(0) + key.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Targeting</label>
                  <select className="w-full h-10 rounded-lg border bg-background px-3 text-sm">
                    <option>All Clinics</option>
                    <option>Specific Plans</option>
                    <option>Specific Clinics</option>
                  </select>
                </div>
              </div>
              <Button className="w-full bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-white">Publish Announcement</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {mockAnnouncements.map(a => {
          const config = typeConfig[a.type]
          return (
            <Card key={a.id} className={cn("border-none", config.bg)}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className={cn("p-2.5 rounded-xl shrink-0", config.bg)}>
                  <config.icon className={cn("h-5 w-5", config.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-foreground">{a.title}</h4>
                    <Badge variant="outline" className={cn("text-[10px] font-semibold", config.border, config.color)}>
                      {a.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {a.target}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(a.startsAt, "MMM d, yyyy")}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.isDismissible ? "Dismissible" : "Required"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}