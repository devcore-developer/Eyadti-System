"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, CalendarDays, Clock, User, Stethoscope, FileText, ClipboardCheck, Ban, DollarSign } from "lucide-react"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { AppointmentStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"

interface AppointmentDrawerProps {
  appointment: any // هيتم استبدالها بالـ Type الحقيقي
  isOpen: boolean
  onClose: () => void
}

export function AppointmentDrawer({ appointment, isOpen, onClose }: AppointmentDrawerProps) {
  if (!appointment) return null

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-fade" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white dark:bg-[#17212F] shadow-2xl p-0 data-[state=open]:animate-slide-in-from-right flex flex-col">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-6 border-b border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)]">
            <Dialog.Title className="text-xl font-semibold text-foreground">Appointment Details</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </Dialog.Close>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Status & Time */}
            <div className="p-5 rounded-[20px] bg-gradient-to-br from-[#F5F9FF] to-[#F0F8FF] dark:from-[#223247] dark:to-[#1D2A3B] border border-[rgba(148,163,184,0.1)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-[#6B9CFF]" />
                  {new Date(appointment.dateTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <AppointmentStatusBadge status={appointment.status as AppointmentStatus} />
              </div>
              <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <Clock className="h-5 w-5 text-[#5BC0BE]" />
                {new Date(appointment.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
            </div>

            {/* Patient Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient</h3>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.1)]">
                <div className="p-2 rounded-lg bg-[#5BC0BE]/10"><User className="h-5 w-5 text-[#5BC0BE]" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{appointment.patient?.fullName}</p>
                  <p className="text-xs text-muted-foreground">Patient Profile</p>
                </div>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Doctor</h3>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.1)]">
                <div className="p-2 rounded-lg bg-[#6B9CFF]/10"><Stethoscope className="h-5 w-5 text-[#6B9CFF]" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{appointment.doctor?.name}</p>
                  <p className="text-xs text-muted-foreground">Attending Physician</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h3>
                <p className="text-sm text-foreground bg-muted/30 p-4 rounded-xl">{appointment.notes}</p>
              </div>
            )}
          </div>

          {/* Drawer Footer (Quick Actions) */}
          <div className="p-6 border-t border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#17212F] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button className="w-full bg-gradient-to-r from-[#5BC0BE] to-[#6B9CFF] text-white rounded-xl shadow-sm hover:shadow-md transition-all">
                <ClipboardCheck className="h-4 w-4 mr-1.5" /> Check In
              </Button>
              <Button variant="outline" className="w-full rounded-xl border-dashed">
                <CalendarDays className="h-4 w-4 mr-1.5" /> Reschedule
              </Button>
              <Button variant="outline" className="w-full rounded-xl">
                <FileText className="h-4 w-4 mr-1.5" /> Create Visit
              </Button>
              <Button variant="outline" className="w-full rounded-xl">
                <DollarSign className="h-4 w-4 mr-1.5" /> Invoice
              </Button>
            </div>
            <Button variant="ghost" className="w-full text-[#EF6B6B] hover:text-[#EF6B6B] hover:bg-[#EF6B6B]/5 rounded-xl">
              <Ban className="h-4 w-4 mr-1.5" /> Cancel Appointment
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}