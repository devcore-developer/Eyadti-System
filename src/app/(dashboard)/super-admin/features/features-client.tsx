"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Search, Shield, MessageSquare, CalendarCheck, BarChart3 } from "lucide-react"
import { toggleFeatureFlag } from "@/lib/actions/super-admin"
import { cn } from "@/lib/utils"

interface Clinic {
  id: string
  name: string
  subscription: { status: string; plan: { name: string } | null } | null
  features: {
    whatsappEnabled: boolean
    onlineBookingEnabled: boolean
    smsNotifications: boolean
    analyticsEnabled: boolean
  }
}

const FLAGS_CONFIG = [
  { key: "onlineBookingEnabled", label: "Online Booking", icon: CalendarCheck, description: "Allow patients to book online" },
  { key: "whatsappEnabled", label: "WhatsApp Integration", icon: MessageSquare, description: "Send reminders via WhatsApp" },
  { key: "smsNotifications", label: "SMS Notifications", icon: Shield, description: "Send SMS alerts to patients" },
  { key: "analyticsEnabled", label: "Advanced Analytics", icon: BarChart3, description: "Unlock detailed charts & reports" },
]

export function FeaturesClient({ initialClinics }: { initialClinics: Clinic[] }) {
  const [clinics, setClinics] = useState(initialClinics)
  const [search, setSearch] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const filteredClinics = clinics.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const handleToggle = async (clinicId: string, featureKey: string, currentValue: boolean) => {
    setTogglingId(`${clinicId}-${featureKey}`)
    const newValue = !currentValue
    
    // Optimistic UI Update
    setClinics(prev => prev.map(c => 
      c.id === clinicId 
        ? { ...c, features: { ...c.features, [featureKey]: newValue } } 
        : c
    ))

    const result = await toggleFeatureFlag(clinicId, featureKey, newValue)
    
    if (!result.success) {
      // Rollback on error
      setClinics(prev => prev.map(c => 
        c.id === clinicId 
          ? { ...c, features: { ...c.features, [featureKey]: currentValue } } 
          : c
      ))
    }
    setTogglingId(null)
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Feature Flags</h2>
          <p className="text-muted-foreground mt-1">Toggle platform features per clinic without deployments.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clinics..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filteredClinics.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No clinics found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredClinics.map((clinic) => (
            <Card key={clinic.id} className="border-border/50 overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-3 bg-muted/20 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {clinic.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{clinic.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {clinic.subscription?.plan?.name || 'No Plan'} • {clinic.subscription?.status || 'INACTIVE'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">
                    {clinic.subscription?.status || 'inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {FLAGS_CONFIG.map((flag) => {
                    const FlagIcon = flag.icon
                    const isToggling = togglingId === `${clinic.id}-${flag.key}`
                    const isEnabled = clinic.features[flag.key as keyof typeof clinic.features]
                    
                    return (
                      <div 
                        key={flag.key} 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-colors",
                          isEnabled ? "bg-primary/5 border-primary/20" : "bg-background border-border/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <FlagIcon className={cn("h-4 w-4", isEnabled ? "text-primary" : "text-muted-foreground")} />
                          <div>
                            <p className="text-sm font-medium leading-none">{flag.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{flag.description}</p>
                          </div>
                        </div>
                        <Switch 
                          checked={isEnabled} 
                          onCheckedChange={() => handleToggle(clinic.id, flag.key, isEnabled)}
                          disabled={isToggling}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}