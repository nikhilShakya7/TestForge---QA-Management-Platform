import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

/**
 * Public routes that do not require authentication.
 */
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/register"];

/**
 * Routes that redirect authenticated users away (login/register).
 */
const AUTH_ONLY_ROUTES = ["/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the session token from cookies
  const token = request.cookies.get("session")?.value;
  const session = token ? verifyToken(token) : null;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(pathname);

  // If user is authenticated and tries to access login/register, redirect to dashboard
  if (session && isAuthOnlyRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If route is not public and no session, redirect to login
  if (!isPublicRoute && !session) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (auth routes handled internally)
     * - api/test-cases, api/test-suites (have their own auth checks)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/test-cases|api/test-suites).*)",
  ],
};
