import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const testRunSchema = z.object({
  name: z.string().min(1, "Test run name is required"),
  description: z.string().optional(),
  suiteId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const suiteId = searchParams.get("suiteId") || undefined;
    const status = searchParams.get("status") || undefined;

    const testRuns = await prisma.testRun.findMany({
      where: {
        ...(suiteId ? { suiteId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        suite: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { executions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(testRuns);
  } catch (error) {
    console.error("GET /api/test-runs error:", error);
    return NextResponse.json({ error: "Failed to fetch test runs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = testRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await getCurrentUser(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (parsed.data.suiteId) {
      const suite = await prisma.testSuite.findUnique({
        where: { id: parsed.data.suiteId },
      });
      if (!suite) {
        return NextResponse.json(
          { error: `Test suite "${parsed.data.suiteId}" not found` },
          { status: 404 }
        );
      }
    }

    const testRun = await prisma.testRun.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        status: "Planned",
        suiteId: parsed.data.suiteId ?? null,
        createdById: user.id,
      },
      include: {
        suite: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(testRun, { status: 201 });
  } catch (error) {
    console.error("POST /api/test-runs error:", error);
    return NextResponse.json({ error: "Failed to create test run" }, { status: 500 });
  }
}
