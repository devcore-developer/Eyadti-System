import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ❌ تم حذف export const runtime = 'nodejs' لأنه يسبب مشاكل في الـ Edge Runtime مع NextAuth في الإنتاج

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
  const isProtectedRoute = pathname.startsWith("/dashboard") ||
                           pathname.startsWith("/patients") ||
                           pathname.startsWith("/appointments") ||
                           pathname.startsWith("/settings") ||
                           pathname.startsWith("/admin") ||
                           pathname.startsWith("/invoices")

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ─── فحص حالة الاشتراك وتاريخ الانتهاء ────────────────────────────
  if (isLoggedIn && req.auth?.user) {
    const status = req.auth.user.subscriptionStatus;
    
    // جلب تواريخ الانتهاء من الـ Session (الفترة المجانية أو الاشتراك المدفوع)
    const trialEndsAt = req.auth.user.trialEndsAt ? new Date(req.auth.user.trialEndsAt) : null;
    const currentPeriodEnd = req.auth.user.currentPeriodEnd ? new Date(req.auth.user.currentPeriodEnd) : null;
    
    const now = new Date();
    let isExpired = false;

    // 1. لو الـ Status مرفوض تماماً
    if (status === "EXPIRED" || status === "SUSPENDED" || status === "CANCELLED") {
      isExpired = true;
    }
    // 2. لو حالته Trial لكن الفترة المجانية خلصت
    else if (status === "TRIAL" && trialEndsAt && trialEndsAt < now) {
      isExpired = true;
    }
    // 3. لو حالته Active لكن تاريخ الانتهاء خلص (بعد ما دفع كود وبانتهي الوقت)
    else if (status === "ACTIVE" && currentPeriodEnd && currentPeriodEnd < now) {
      isExpired = true;
    }

    // لو الاشتراك منتهي بأي سبب، امنع الدخول وحول على صفحة الدفع/تفعيل الكود
    if (isExpired) {
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