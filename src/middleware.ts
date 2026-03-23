import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/auth", "/login", "/register", "/catalog", "/gift"];
const CLIENT_PATHS = [
  "/dashboard",
  "/recipients",
  "/orders",
  "/subscriptions",
  "/wallet",
  "/cards",
  "/loyalty",
  "/settings",
];
const ADMIN_PATHS = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — just refresh session
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Client routes — require auth
  if (CLIENT_PATHS.some((p) => pathname.startsWith(p))) {
    const { supabaseResponse, user } = await updateSession(request);
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Admin routes — require auth (role check in layout)
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (pathname === "/admin/login") {
      const { supabaseResponse } = await updateSession(request);
      return supabaseResponse;
    }
    const { supabaseResponse, user } = await updateSession(request);
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // API routes — pass through with session refresh
  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
