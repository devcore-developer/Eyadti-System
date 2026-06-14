import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  output: 'standalone',
  // ✨ السطر السحري: تغيير مسار الـ Build عشان نكسر أي Cache قديم
  distDir: 'build', 
  serverExternalPackages: ["@prisma/client", "prisma", "pg", "@prisma/adapter-pg"],
};

export default withPWA(nextConfig);