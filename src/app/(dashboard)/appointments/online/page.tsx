import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Globe } from "lucide-react"

export default async function OnlineBookingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  // السماح للأدمن والريسبشن يشوفوا الصفحة دي
  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  const bookings = await prisma.booking.findMany({
    where: { 
      clinicId: session.user.clinicId,
      source: "WEBSITE" 
    },
    include: {
      patient: { select: { fullName: true, phone: true } },
      doctor: { select: { name: true } },
      appointment: { select: { dateTime: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="h-6 w-6 text-teal-600" /> Online Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage bookings from your public booking page</p>
        </div>
        <Link href="/book" target="_blank" className="text-sm text-teal-600 hover:underline border px-3 py-2 rounded-lg">
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
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium">Patient</th>
                <th className="text-left p-4 font-medium">Doctor</th>
                <th className="text-left p-4 font-medium">Date & Time</th>
                <th className="text-left p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{b.patient.fullName}</td>
                  <td className="p-4 text-gray-600">Dr. {b.doctor.name}</td>
                  <td className="p-4 text-gray-600">{b.appointment?.dateTime ? new Date(b.appointment.dateTime).toLocaleString() : 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      b.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : 
                      b.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}