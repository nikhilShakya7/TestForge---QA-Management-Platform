import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const testSuiteSchema = z.object({
  name: z.string().min(1, "Suite name is required"),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const testSuites = await prisma.testSuite.findMany({
      include: {
        _count: { select: { testCases: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(testSuites);
  } catch (error) {
    console.error("GET /api/test-suites error:", error);
    return NextResponse.json(
      { error: "Failed to fetch test suites" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = testSuiteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // TODO: Replace with the authenticated user's ID once auth is implemented.
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      return NextResponse.json(
        { error: "No users found. Seed the database first." },
        { status: 400 }
      );
    }

    const testSuite = await prisma.testSuite.create({
      data: {
        ...parsed.data,
        createdById: defaultUser.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(testSuite, { status: 201 });
  } catch (error) {
    console.error("POST /api/test-suites error:", error);
    return NextResponse.json(
      { error: "Failed to create test suite" },
      { status: 500 }
    );
  }
}
