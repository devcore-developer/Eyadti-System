import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // تم حذف skipWaiting لأن المكتبة بتتعامل معاها اتوماتيكياً
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "pg", "@prisma/adapter-pg"],
};

export default withPWA(nextConfig);