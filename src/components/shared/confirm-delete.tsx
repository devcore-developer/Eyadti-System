"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

type Props = {
  title: string
  description: string
  onConfirm: () => Promise<void>
  children: React.ReactNode
}

export function ConfirmDelete({ title, description, onConfirm, children }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      await onConfirm()
      setIsOpen(false)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      
      <DialogContent className="max-w-md border-red-200/50 dark:border-red-900/30 bg-white dark:bg-[#1A2332] shadow-[0_25px_50px_rgba(0,0,0,0.25)] rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-800/20 text-red-600 dark:text-red-400 shadow-sm">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="p-6 pt-8 bg-slate-50/50 dark:bg-[#131B27] gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)} 
            disabled={isPending}
            className="rounded-xl border-0 bg-white dark:bg-[#223247] hover:bg-slate-100 dark:hover:bg-[#2A3B4E] px-5 py-2.5 font-semibold transition-colors shadow-sm"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isPending}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl px-5 py-2.5 shadow-[0_8px_20px_rgba(239,68,68,0.25)] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-60"
          >
            {isPending ? "Deleting..." : "Yes, Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}