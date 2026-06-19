"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Check, X } from "lucide-react"
import { getAllClinicsWithFlags, toggleFeatureFlag } from "@/lib/actions/admin"
import { toast } from "sonner"

export default function FeatureFlagsPage() {
  const [clinics, setClinics] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const data = await getAllClinicsWithFlags()
      setClinics(data)
    }
    load()
  }, [])

  const filteredClinics = clinics.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const handleToggle = async (clinicId: string, feature: string, value: boolean) => {
    setIsLoading(clinicId)
    try {
      const result = await toggleFeatureFlag(clinicId, feature, value)
      if (result?.success) {
        toast.success(`Feature ${feature} updated for clinic.`)
        setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, features: { ...c.features, [feature]: value } } : c))
      } else {
        toast.error("Failed to update feature flag")
      }
    } catch (error) {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsLoading(null)
    }
  }

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
              <thead className="[&_tr]:border-b">
                <tr className="border-b">
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Clinic Name</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">WhatsApp</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Online Booking</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">SMS Notifications</th>
                </tr>
              </thead>
              <tbody>
                {filteredClinics.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No clinics found.</td></tr>
                ) : (
                  filteredClinics.map((clinic) => (
                    <tr key={clinic.id} className="border-b">
                      <td className="p-4 font-medium">{clinic.name}</td>
                      <td className="p-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-12 p-0 data-[state=open]:bg-emerald-500 data-[state=closed]:bg-muted"
                          data-state={clinic.features.whatsappEnabled ? "open" : "closed"}
                          onClick={() => handleToggle(clinic.id, 'whatsappEnabled', !clinic.features.whatsappEnabled)}
                          disabled={isLoading === clinic.id}
                        >
                          {isLoading === clinic.id ? null : <Check className="h-4 w-4" />}
                        </Button>
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-12 p-0 data-[state=open]:bg-emerald-500 data-[state=closed]:bg-muted"
                          data-state={clinic.features.onlineBookingEnabled ? "open" : "closed"}
                          onClick={() => handleToggle(clinic.id, 'onlineBookingEnabled', !clinic.features.onlineBookingEnabled)}
                          disabled={isLoading === clinic.id}
                        >
                          {isLoading === clinic.id ? null : <Check className="h-4 w-4" />}
                        </Button>
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-12 p-0 data-[state=open]:bg-emerald-500 data-[state=closed]:bg-muted"
                          data-state={clinic.features.smsNotifications ? "open" : "closed"}
                          onClick={() => handleToggle(clinic.id, 'smsNotifications', !clinic.features.smsNotifications)}
                          disabled={isLoading === clinic.id}
                        >
                          {isLoading === clinic.id ? null : <Check className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}