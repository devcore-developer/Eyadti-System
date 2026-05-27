import 'dotenv/config'; // ← السطر ده اللي هيفك المشكلة
import { PrismaClient, SubscriptionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Plans...");

  // 1. إنشاء الخطط
  const basic = await prisma.plan.upsert({
    where: { slug: "basic" },
    update: {},
    create: {
      name: "Basic",
      slug: "basic",
      description: "Perfect for solo practitioners.",
      monthlyPrice: 29,
      yearlyPrice: 278,
      maxDoctors: 1,
      maxUsers: 2,
      maxPatients: 500,
      maxBranches: 1,
      onlineBookingEnabled: false,
      analyticsEnabled: false,
      notificationsEnabled: true,
      active: true,
    },
  });

  const professional = await prisma.plan.upsert({
    where: { slug: "professional" },
    update: {},
    create: {
      name: "Professional",
      slug: "professional",
      description: "Ideal for growing clinics.",
      monthlyPrice: 79,
      yearlyPrice: 758,
      maxDoctors: 5,
      maxUsers: 10,
      maxPatients: -1, // -1 يعني Unlimited
      maxBranches: 2,
      onlineBookingEnabled: true,
      analyticsEnabled: true,
      notificationsEnabled: true,
      active: true,
    },
  });

  const enterprise = await prisma.plan.upsert({
    where: { slug: "enterprise" },
    update: {},
    create: {
      name: "Enterprise",
      slug: "enterprise",
      description: "For large organizations.",
      monthlyPrice: 199,
      yearlyPrice: 1908,
      maxDoctors: -1,
      maxUsers: -1,
      maxPatients: -1,
      maxBranches: -1,
      onlineBookingEnabled: true,
      analyticsEnabled: true,
      notificationsEnabled: true,
      active: true,
    },
  });

  console.log("Plans seeded:", { basic, professional, enterprise });

  // 2. إنشاء اشتراك تجريبي لأول عيادة في النظام
  const firstClinic = await prisma.clinic.findFirst();
  
  if (firstClinic) {
    const existingSub = await prisma.subscription.findUnique({
      where: { clinicId: firstClinic.id },
    });

    if (!existingSub) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 يوم تجريبية

      await prisma.subscription.create({
        data: {
          clinicId: firstClinic.id,
          planId: basic.id,
          status: SubscriptionStatus.TRIAL,
          trialEndsAt: trialEndsAt,
        },
      });
      console.log(`Trial subscription created for clinic: ${firstClinic.name}`);
    } else {
      console.log("Clinic already has a subscription.");
    }
  } else {
    console.log("No clinics found in the database to attach a subscription.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });