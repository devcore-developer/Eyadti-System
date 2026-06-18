"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner" // أو alert عادي

// Mock Data (In real app, fetched from API)
const mockClinics = [
  { id: "1", name: "Cairo Dental Care", subscription: "ACTIVE", features: { whatsapp: true, booking: true, sms: false } },
  { id: "2", name: "Alex Heart Center", subscription: "ACTIVE", features: { whatsapp: false, booking: true, sms: true } },
  { id: "3", name: "Giza Skin Clinic", subscription: "TRIAL", features: { whatsapp: true, booking: false, sms: false } },
]

export default function FeatureFlagsPage() {
  const [clinics, setClinics] = useState(mockClinics)
  const [search, setSearch] = useState("")

  const handleToggle = async (clinicId: string, feature: string, value: boolean) => {
    // Optimistic Update
    setClinics(prev => prev.map(c => 
      c.id === clinicId 
        ? { ...c, features: { ...c.features, [feature]: value } }
        : c
    ))

    // API Call
    // await toggleFeatureFlag(clinicId, feature, value)
    
    toast.success(`Feature ${feature} updated for clinic.`)
  }

  const filteredClinics = clinics.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Feature Flags</h2>
          <p className="text-muted-foreground mt-1">Enable or disable specific features per clinic.</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search clinic..." 
            className="pl-8" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="pb-3 font-medium">Clinic Name</th>
                  <th className="pb-3 font-medium">Subscription</th>
                  <th className="pb-3 font-medium text-center">WhatsApp</th>
                  <th className="pb-3 font-medium text-center">Online Booking</th>
                  <th className="pb-3 font-medium text-center">SMS Notifications</th>
                </tr>
              </thead>
              <tbody>
                {filteredClinics.map((clinic) => (
                  <tr key={clinic.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-4 font-medium">{clinic.name}</td>
                    <td className="py-4">
                      <Badge variant="outline">{clinic.subscription}</Badge>
                    </td>
                    <td className="py-4 text-center">
                      <Switch 
                        checked={clinic.features.whatsapp} 
                        onCheckedChange={(val) => handleToggle(clinic.id, 'whatsapp', val)} 
                      />
                    </td>
                    <td className="py-4 text-center">
                      <Switch 
                        checked={clinic.features.booking} 
                        onCheckedChange={(val) => handleToggle(clinic.id, 'booking', val)} 
                      />
                    </td>
                    <td className="py-4 text-center">
                      <Switch 
                        checked={clinic.features.sms} 
                        onCheckedChange={(val) => handleToggle(clinic.id, 'sms', val)} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}