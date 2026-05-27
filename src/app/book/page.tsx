// src/app/book/page.tsx

import { getPublicClinicInfo, getAvailableDoctors } from "@/lib/actions/booking"
import Image from "next/image"
import Link from "next/link"
import { User } from "lucide-react"

const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID || "c1"

export default async function BookPage() {
  const [clinic, doctors] = await Promise.all([
    getPublicClinicInfo(CLINIC_ID),
    getAvailableDoctors(CLINIC_ID),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          {clinic.logoUrl && (
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Image src={clinic.logoUrl} alt={clinic.name} fill className="object-contain rounded-lg" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900">{clinic.name}</h1>
          <p className="text-gray-500 mt-2">Book your appointment online</p>
        </div>

        {/* Doctor Selection */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">1. Select a Doctor</h2>
          
          {doctors.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border">
              <p className="text-gray-500">No doctors available for online booking at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {doctors.map((doctor) => (
                <Link
                  key={doctor.id}
                  href={`/book/${doctor.id}`}
                  className="bg-white p-6 rounded-xl border hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center shrink-0">
                      {doctor.image ? (
                        <Image src={doctor.image} alt={doctor.name} width={64} height={64} className="rounded-full" />
                      ) : (
                        <User className="h-8 w-8 text-teal-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                        Dr. {doctor.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {doctor.workingDays.map((day) => (
                          <span key={day} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}