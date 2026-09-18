import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";

const PRIVATE_DASHBOARD_PREFIXES = [
  "/dashboard/workflows",
  "/dashboard/brand",
  "/dashboard/resources",
  "/dashboard/clients",
  "/dashboard/people",
  "/dashboard/products",
  "/dashboard/campaigns",
];

function isPrivateDashboardPath(pathname: string) {
  return PRIVATE_DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function safeNextPath(request: NextRequest) {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/auth/login";
  const requiresAuthentication = isPrivateDashboardPath(pathname);

  if (!isLogin && !requiresAuthentication) return NextResponse.next();

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let authenticated = false;

  if (sessionCookie) {
    try {
      await verifySessionCookie(sessionCookie);
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  if (isLogin) {
    if (authenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const response = NextResponse.next();
    if (sessionCookie) response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  if (!authenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", safeNextPath(request));
    const response = NextResponse.redirect(loginUrl);
    if (sessionCookie) response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/login"],
  runtime: "nodejs",
};
