import { prisma } from "@/lib/db"

export async function getFinancialAnalytics(clinicId: string) {
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const invoices = await prisma.invoice.findMany({
    where: { 
      clinicId,
      createdAt: { gte: twelveMonthsAgo }
    },
    select: {
      status: true,
      amount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' }
  })

  // Group by month
  const monthlyData: Record<string, { revenue: number; collections: number; outstanding: number; invoices: number }> = {}

  for (let i = 0; i < 12; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, collections: 0, outstanding: 0, invoices: 0 }
  }

  invoices.forEach(inv => {
    const date = new Date(inv.createdAt)
    const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    
    if (monthlyData[key]) {
      const amount = Number(inv.amount)
      monthlyData[key].invoices++
      
      if (inv.status === 'PAID') {
        monthlyData[key].revenue += amount
        monthlyData[key].collections += amount
      } else if (inv.status === 'PARTIAL') {
        monthlyData[key].revenue += amount * 0.5
        monthlyData[key].collections += amount * 0.5
        monthlyData[key].outstanding += amount * 0.5
      } else {
        monthlyData[key].outstanding += amount
      }
    }
  })

  // Convert to array and reverse to be chronological
  return Object.entries(monthlyData).reverse().map(([name, data]) => ({ name, ...data }))
}