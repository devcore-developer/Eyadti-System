import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Globe } from "lucide-react"
import { OnlineBookingsClient } from "./online-bookings-client"

export default async function OnlineBookingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  const bookings = await prisma.booking.findMany({
    where: { 
      clinicId: session.user.clinicId,
      source: "WEBSITE" 
    },
    include: {
      patient: { select: { fullName: true, phone: true, gender: true, dateOfBirth: true, id: true } },
      doctor: { select: { name: true, image: true, specialty: true } },
      appointment: { 
        select: { 
          dateTime: true, 
          status: true, 
          id: true,
          notes: true,
          visit: { select: { id: true, status: true, checkedInAt: true } }
        } 
      },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-teal-600" /> Online Bookings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage bookings from your public booking page</p>
        </div>
        <Link 
          href="/book" 
          target="_blank" 
          className="text-sm text-teal-600 hover:underline border border-teal-200 px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors"
        >
          View Public Page
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <Globe className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">No Online Bookings Yet</h2>
          <p className="text-sm text-gray-400 mt-1">Share your booking page link with patients.</p>
        </div>
      ) : (
        <OnlineBookingsClient bookings={bookings} />
      )}
    </div>
  )
}