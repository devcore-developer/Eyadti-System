// seed.js
require('dotenv').config();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Truncating all tables (Clean Slate)...');
  // الأمر ده بيمسح كل الداتا القديمة وبيتجاوز الـ Foreign Keys عشان مفيش Error
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "clinics", "users", "patients", "appointments", "invoices", "invoice_items", "subscriptions" CASCADE;`);

  console.log('🏗️ Seeding database...');

  // 1. فك الـ Constraint المؤقت عشان نقدر ننشأ العيادة من غير Owner
  console.log('🔧 Temporarily altering clinics table...');
  await prisma.$executeRawUnsafe(`ALTER TABLE "clinics" ALTER COLUMN "ownerId" DROP NOT NULL;`);

  // 2. إنشاء العيادة من غير Owner
  console.log('🏢 Creating clinic...');
  await prisma.$executeRawUnsafe(`INSERT INTO "clinics" ("id", "name", "ownerId", "createdAt", "updatedAt") VALUES ('c1', 'Eyadti Clinic', NULL, NOW(), NOW());`);

  // 3. تشفير الباسورد وإنشاء الأدمن والدكتور
  console.log('🔑 Hashing passwords...');
  const adminPassword = await bcrypt.hash('Admin@2024!', 10);
  const doctorPassword = await bcrypt.hash('Doctor@2024!', 10);

  console.log('👤 Creating users...');
  await prisma.user.createMany({
    data: [
      {
        id: 'u1',
        name: 'Admin',
        email: 'admin@eyadti.com',
        password: adminPassword,
        role: 'ADMIN',
        clinicId: 'c1',
      },
      {
        id: 'd1',
        name: 'Dr. Sarah',
        email: 'doctor@eyadti.com',
        password: doctorPassword,
        role: 'DOCTOR',
        clinicId: 'c1',
      }
    ]
  });

  // 4. إنشاء المريض التجريبي
  console.log('🤒 Creating patient...');
  await prisma.patient.create({
    data: {
      id: 'p1',
      fullName: 'Ahmed Hassan',
      phone: '01012345678',
      email: 'ahmed@example.com',
      gender: 'MALE',
      dateOfBirth: new Date('1990-05-15'),
      clinicId: 'c1',
    }
  });

  // 5. ربط الأدمن بالعيادة كـ Owner
  console.log('🔗 Linking clinic to owner...');
  await prisma.$executeRawUnsafe(`UPDATE "clinics" SET "ownerId" = 'u1' WHERE "id" = 'c1';`);

  // 6. رجع الـ Constraint زي ما كان
  console.log('🔧 Restoring constraints...');
  await prisma.$executeRawUnsafe(`ALTER TABLE "clinics" ALTER COLUMN "ownerId" SET NOT NULL;`);

  console.log('✅ Seed successful! You can login with:');
  console.log('👉 Admin Email: admin@eyadti.com | Password: Admin@2024!');
  console.log('👉 Doctor Email: doctor@eyadti.com | Password: Doctor@2024!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect()
  });