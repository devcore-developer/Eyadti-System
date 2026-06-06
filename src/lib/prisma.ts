import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  try {
    // لو الـ DATABASE_URL موجود، هيبني العميل صح
    return new PrismaClient()
  } catch (error) {
    // لو وقت الـ Build الـ URL مش موجود، Prisma هترمي خطأ، هنمسكه ونرجع Dummy Object عشان البناء يكمل
    console.warn('⚠️ PrismaClient could not be initialized (Build phase). Returning dummy client.')
    return {} as PrismaClient
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
  globalForPrisma.prisma = prisma
}