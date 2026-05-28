import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface AuthRequest extends NextRequest {
  auth: any;
}

const ALLOWED_PATHS_WHEN_EXPIRED = [
  "/settings/billing",
  "/settings/subscriptions",
  "/settings",
  "/api/auth",
];

export default auth((req: AuthRequest) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const isProtectedRoute = pathname.startsWith("/dashboard") ||
                           pathname.startsWith("/patients") ||
                           pathname.startsWith("/appointments") ||
                           pathname.startsWith("/settings") ||
                           pathname.startsWith("/admin") ||
                           pathname.startsWith("/super-admin") || // ← أضفنا المسار الجديد
                           pathname.startsWith("/invoices")

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && req.auth?.user) {
    const status = req.auth.user.subscriptionStatus;
    const role = req.auth.user.role;
    
    // ✅ لو ده صاحب المنصة (SUPER_ADMIN)، سيبه يدخل أي مكان ومش تطبق عليه قوانين الاشتراك
    if (role === "SUPER_ADMIN") {
      return NextResponse.next();
    }

    const trialEndsAt = req.auth.user.trialEndsAt ? new Date(req.auth.user.trialEndsAt) : null;
    const currentPeriodEnd = req.auth.user.currentPeriodEnd ? new Date(req.auth.user.currentPeriodEnd) : null;
    
    const now = new Date();
    let isExpired = false;

    if (status === "EXPIRED" || status === "SUSPENDED" || status === "CANCELLED") {
      isExpired = true;
    } else if (status === "TRIAL" && trialEndsAt && trialEndsAt < now) {
      isExpired = true;
    } else if (status === "ACTIVE" && currentPeriodEnd && currentPeriodEnd < now) {
      isExpired = true;
    }

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