import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const p = new PrismaClient({ adapter })

async function main() {
  // 1. إنشاء خطة Professional
  const proPlan = await p.plan.create({
    data: {
      name: "Professional",
      slug: "professional",
      description: "For growing clinics and medical centers",
      monthlyPrice: 1000,
      yearlyPrice: 10000,
      maxDoctors: 5,
      maxUsers: 8,
      maxPatients: -1,
      maxBranches: 3,
      maxMonthlyVisits: -1,
      onlineBookingEnabled: true,
      doctorSchedulesEnabled: true,
      analyticsEnabled: true,
      whatsappEnabled: true,
      auditLogsEnabled: true,
      galleryEnabled: true,
      advancedInvoicesEnabled: true,
      doctorAttendanceEnabled: true,
      queueManagementEnabled: true,
      waitingRoomDisplayEnabled: true,
      active: true,
    },
  })
  console.log("Created professional plan:", proPlan.id.slice(0, 8))

  // 2. نقل اشتراك Mo's Clinic
  const oldPro = await p.plan.findUnique({ where: { slug: "pro" } })
  if (oldPro) {
    const moved = await p.subscription.updateMany({
      where: { planId: oldPro.id },
      data: { planId: proPlan.id },
    })
    console.log("Moved", moved.count, "subscription(s) to new professional plan")

    // تعطيل القديمة
    await p.plan.update({
      where: { id: oldPro.id },
      data: { active: false },
    })
    console.log("Deactivated old pro plan")
  }

  // 3. عرض النتيجة
  console.log("\n=== ACTIVE PLANS ===")
  const plans = await p.plan.findMany({
    where: { active: true },
    orderBy: { monthlyPrice: "asc" },
  })
  for (const x of plans) {
    console.log(x.slug.padEnd(15), x.monthlyPrice + " EGP")
  }

  console.log("\n=== SUBSCRIPTIONS ===")
  const subs = await p.subscription.findMany({
    include: {
      plan: { select: { name: true, slug: true, monthlyPrice: true } },
      clinic: { select: { name: true } },
    },
  })
  for (const x of subs) {
    console.log(
      x.clinic?.name?.padEnd(25),
      x.plan?.name?.padEnd(25),
      x.plan?.monthlyPrice + " EGP"
    )
  }

  await p.$disconnect()
  await pool.end()
}

main()