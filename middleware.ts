// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// تشغيل الـ Middleware في بيئة Node.js العادية لدعم Prisma وتجنب أخطاء Edge Runtime
export const runtime = 'nodejs'

interface AuthRequest extends NextRequest {
  auth: any;
}

// المسارات المسموح بها حتى لو الاشتراك منتهي
const ALLOWED_PATHS_WHEN_EXPIRED = [
  "/settings/billing",
  "/settings/subscriptions",
  "/settings",
  "/api/auth",
];

export default auth((req: AuthRequest) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // لو مسجل دخوله وعامل Redirect لـ /login، حوله على الـ Dashboard
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // حماية مسارات الـ Dashboard الأساسية
  const isProtectedRoute = !pathname.startsWith("/login") && 
                           !pathname.startsWith("/book") && 
                           !pathname.startsWith("/api/auth") && 
                           !pathname.startsWith("/_next");

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ─── فحص حالة الاشتراك ────────────────────────────
  if (isLoggedIn && req.auth?.user) {
    const status = req.auth.user.subscriptionStatus;

    if (status === "EXPIRED" || status === "SUSPENDED") {
      // السماح فقط بصفحات الإعدادات والاشتراكات
      const isAllowed = ALLOWED_PATHS_WHEN_EXPIRED.some(path => pathname.startsWith(path));
      
      if (!isAllowed) {
        const billingUrl = new URL("/settings/billing", req.url);
        billingUrl.searchParams.set("expired", "1");
        return NextResponse.redirect(billingUrl);
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
};