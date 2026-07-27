import { getAnnouncements, archiveAnnouncement, restoreAnnouncement, deleteAnnouncement, getAnnouncementStats } from "@/lib/actions/super-admin"
import { requireRole } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { AnnouncementsManagementClient } from "./announcements-client"

export default async function AnnouncementsManagementPage() {
  try {
    await requireRole("SUPER_ADMIN")
  } catch {
    redirect("/dashboard")
  }

  const announcements = await getAnnouncements()

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Announcement Management</h1>
        <p className="text-muted-foreground text-sm mt-1">View, edit, and manage all platform broadcasts.</p>
      </div>
      
      <AnnouncementsManagementClient initialAnnouncements={announcements} />
    </div>
  )
}