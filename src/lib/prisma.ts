import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? (() => {
  try {
    const client = new PrismaClient()
    // نحفظ الـ Client الحقيقي بس في وضع التطوير (عشان الـ Hot Reload)
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client
    }
    return client
  } catch (error) {
    // لو الداتابيز مش موجودة (وقت البناء)، نرجع Dummy Object عشان يكمل البناء
    // ومش نحفظه في الـ Global عشان وقت التشغيل الحقيقي يبني Client جديد
    console.warn('⚠️ DATABASE_URL missing. Returning Prisma Proxy for build phase.')
    return {} as PrismaClient
  }
})()