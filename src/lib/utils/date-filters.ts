// src/lib/utils/date-filters.ts

import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns"

export type FilterPeriod = "today" | "week" | "month" | "year"

export function getDateRange(period: FilterPeriod) {
  const now = new Date()

  switch (period) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) }
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 6 }), to: endOfDay(now) }
    case "month":
      return { from: startOfMonth(now), to: endOfDay(now) }
    case "year":
      return { from: startOfYear(now), to: endOfDay(now) }
    default:
      return { from: startOfMonth(now), to: endOfDay(now) }
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}