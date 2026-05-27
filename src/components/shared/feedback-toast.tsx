"use client"

import { toast } from "sonner"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

export function showSuccess(title: string, description?: string) {
  toast.success(title, {
    description,
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    className: "border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-[#1A2332] shadow-[0_15px_35px_rgba(0,0,0,0.15)] rounded-xl",
  })
}

export function showError(title: string, description?: string) {
  toast.error(title, {
    description,
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    className: "border-red-200 dark:border-red-900/50 bg-white dark:bg-[#1A2332] shadow-[0_15px_35px_rgba(0,0,0,0.15)] rounded-xl",
  })
}

export function showWarning(title: string, description?: string) {
  toast.warning(title, {
    description,
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    className: "border-amber-200 dark:border-amber-900/50 bg-white dark:bg-[#1A2332] shadow-[0_15px_35px_rgba(0,0,0,0.15)] rounded-xl",
  })
}

export function showInfo(title: string, description?: string) {
  toast.info(title, {
    description,
    icon: <Info className="h-5 w-5 text-[#6B9CFF]" />,
    className: "border-blue-200 dark:border-blue-900/50 bg-white dark:bg-[#1A2332] shadow-[0_15px_35px_rgba(0,0,0,0.15)] rounded-xl",
  })
}