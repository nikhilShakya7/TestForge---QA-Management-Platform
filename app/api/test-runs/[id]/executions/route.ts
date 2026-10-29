import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const executionSchema = z.object({
  testCaseId: z.string({ message: "Test case ID is required" }),
  status: z.enum(["Passed", "Failed", "Blocked"]),
  notes: z.string().optional().nullable(),
  executedAt: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(_request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the test run exists
    const testRun = await prisma.testRun.findUnique({ where: { id } });
    if (!testRun) {
      return NextResponse.json(
        { error: `Test run "${id}" not found` },
        { status: 404 }
      );
    }

    const executions = await prisma.testExecution.findMany({
      where: { testRunId: id },
      include: {
        testCase: { select: { id: true, testCaseId: true, title: true } },
        executedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { executedAt: "desc" },
    });

    return NextResponse.json(executions);
  } catch (error) {
    console.error("GET /api/test-runs/[id]/executions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch executions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the test run exists
    const testRun = await prisma.testRun.findUnique({ where: { id } });
    if (!testRun) {
      return NextResponse.json(
        { error: `Test run "${id}" not found` },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = executionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify the test case exists
    const testCase = await prisma.testCase.findUnique({
      where: { id: parsed.data.testCaseId },
    });
    if (!testCase) {
      return NextResponse.json(
        { error: `Test case "${parsed.data.testCaseId}" not found` },
        { status: 404 }
      );
    }

    const user = await getCurrentUser(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for duplicate execution (one result per test case per run)
    const existing = await prisma.testExecution.findUnique({
      where: {
        testCaseId_testRunId: {
          testCaseId: parsed.data.testCaseId,
          testRunId: id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Test case "${testCase.testCaseId}" already has an execution result in this run. Use PATCH to update it.`,
        },
        { status: 409 }
      );
    }

    const execution = await prisma.testExecution.create({
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes ?? null,
        executedAt: parsed.data.executedAt
          ? new Date(parsed.data.executedAt)
          : new Date(),
        executedById: user.id,
        testCaseId: parsed.data.testCaseId,
        testRunId: id,
      },
      include: {
        testCase: { select: { id: true, testCaseId: true, title: true } },
        executedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(execution, { status: 201 });
  } catch (error) {
    console.error("POST /api/test-runs/[id]/executions error:", error);
    return NextResponse.json(
      { error: "Failed to create execution" },
      { status: 500 }
    );
  }
}
