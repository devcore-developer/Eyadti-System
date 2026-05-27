// src/app/(dashboard)/appointments/online/page.tsx

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getOnlineBookings, confirmBooking, cancelBooking } from "@/lib/actions/booking"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

export default async function OnlineBookingsPage() {
  const session = await auth()
  if (!session?.user?.clinicId) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "RECEPTIONIST") redirect("/dashboard")

  const bookings = await getOnlineBookings(session.user.clinicId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Online Bookings</h1>
        <p className="text-sm text-muted-foreground">Manage appointments booked through the website</p>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-medium">{booking.patient.fullName}</p>
                    <p className="text-xs text-gray-500">{booking.patient.phone}</p>
                  </td>
                  <td className="p-4 text-sm">Dr. {booking.doctor.name}</td>
                  <td className="p-4 text-sm">
                    {format(new Date(booking.appointment.dateTime), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="p-4">
                    <Badge variant={booking.status === "PENDING" ? "secondary" : booking.status === "CONFIRMED" ? "default" : "destructive"}>
                      {booking.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {booking.status === "PENDING" && (
                      <div className="flex gap-2">
                        <form action={async () => { "use server"; await confirmBooking(booking.id) }}>
                          <button type="submit" className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-md hover:bg-teal-100">
                            Confirm
                          </button>
                        </form>
                        <form action={async () => { "use server"; await cancelBooking(booking.id) }}>
                          <button type="submit" className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-md hover:bg-red-100">
                            Cancel
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <div className="p-12 text-center text-gray-500 text-sm">No online bookings yet</div>
          )}
        </div>
      </div>
    </div>
  )
}