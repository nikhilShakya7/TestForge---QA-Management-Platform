import { NextResponse, type NextRequest } from "next/server";
import {
  clearSessionCookie,
  getSessionFromRequest,
  getCurrentUser,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await getCurrentUser(session.userId);

    if (!user || !user.isActive) {
      return clearSessionCookie(
        NextResponse.json({ error: "Authentication required" }, { status: 401 })
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
