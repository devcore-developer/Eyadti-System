import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Globe } from "lucide-react"
import { OnlineBookingsClient } from "./online-bookings-client"
import { FeatureGate } from "@/components/billing/feature-gate"
import { getFeatureAccess } from "@/lib/services/feature-gate"

export const dynamic = "force-dynamic"

export default async function OnlineBookingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  // ═══════════════════════════════════════════════════════
  // ✅ FIX: احصل على slug العيادة الحالية، لا أول عيادة في الـ DB
  // ═══════════════════════════════════════════════════════
  const currentClinic = await prisma.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: { id: true, name: true, slug: true },
  })

  // لا يجب أن يحدث هذا أبداً، لكن fallback آمن
  if (!currentClinic) {
    redirect("/dashboard")
  }

  const publicBookingUrl = `/book/${currentClinic.slug}`

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

  const features = session.user.clinicId
    ? await getFeatureAccess(session.user.clinicId)
    : {}

  return (
    <FeatureGate feature="ONLINE_BOOKING" features={features}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-teal-600" /> Online Bookings
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage bookings from your public booking page</p>
          </div>
          <Link 
            href={publicBookingUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 border border-teal-200 px-4 py-2.5 rounded-xl hover:border-teal-300 transition-all duration-200 flex items-center gap-2 font-medium"
          >
            <Globe className="h-4 w-4" />
            View Public Page
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <Globe className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600">No Online Bookings Yet</h2>
            <p className="text-sm text-gray-400 mt-1 mb-6">Share your booking page link with patients.</p>
            <Link 
              href={publicBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium text-sm"
            >
              <Globe className="h-4 w-4" />
              Open Public Booking Page
            </Link>
          </div>
        ) : (
          <OnlineBookingsClient bookings={bookings} />
        )}
      </div>
    </FeatureGate>
  )
}