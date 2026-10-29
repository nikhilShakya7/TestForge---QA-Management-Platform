import { sign, verify, type JwtPayload } from "jsonwebtoken";
import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is not set. Add it to .env (see .env.example)."
  );
}

const JWT_SECRET_STRING: string = JWT_SECRET;

/**
 * Shape of the data stored inside the JWT.
 */
export type SessionUser = {
  userId: string;
  email: string;
  name: string | null;
  role: string;
};

/**
 * Hash a plain-text password using bcrypt.
 * Cost factor 12 is a good balance between security and performance.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Compare a plain-text password against a stored hash.
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(plainPassword, hashedPassword);
}

/**
 * Sign a JWT session token. Returns the token string.
 */
export function signToken(payload: SessionUser): string {
  return sign(payload, JWT_SECRET_STRING, { expiresIn: "7d" });
}

/**
 * Verify a JWT token and return the decoded payload, or null if invalid.
 */
export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = verify(
      token,
      JWT_SECRET_STRING
    ) as unknown as SessionUser & JwtPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/**
 * Get the current session user from the request cookies.
 * Returns null if no valid session exists.
 */
export function getSessionFromRequest(
  request: NextRequest
): SessionUser | null {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Get the current session user from server-side (Next.js cookies()).
 * Used in Server Components.
 */
export async function getSessionFromCookies(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Set the session cookie on a response.
 */
export function setSessionCookie(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set({
    name: "session",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}

/**
 * Clear the session cookie.
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: "session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

/**
 * Fetch the full User record from the database using the session userId.
 */
export async function getCurrentUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

/**
 * Middleware helper: require authentication.
 * Returns a NextResponse with 401 if no session, or null if authenticated.
 */
export function requireAuth(
  request: NextRequest
): { user: SessionUser } | { errorResponse: NextResponse } {
  const user = getSessionFromRequest(request);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  return { user };
}
