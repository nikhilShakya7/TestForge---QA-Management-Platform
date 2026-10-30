import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const updateExecutionSchema = z.object({
  status: z.enum(["Passed", "Failed", "Blocked"]).optional(),
  actualResult: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * PATCH /api/test-runs/[id]/executions/[executionId]
 * Update an existing test execution result and record history.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; executionId: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: testRunId, executionId } = await params;

    const body = await request.json();
    const parsed = updateExecutionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const testRun = await prisma.testRun.findUnique({
      where: { id: testRunId, createdById: session.userId },
    });
    if (!testRun) {
      return NextResponse.json(
        { error: `Test run "${testRunId}" not found` },
        { status: 404 }
      );
    }

    const existingExecution = await prisma.testExecution.findUnique({
      where: { id: executionId },
      include: {
        testCase: {
          select: {
            id: true,
            testCaseId: true,
            title: true,
            expectedResult: true,
          },
        },
      },
    });
    if (!existingExecution) {
      return NextResponse.json(
        { error: `Test execution "${executionId}" not found` },
        { status: 404 }
      );
    }

    // Ensure the execution belongs to this test run
    if (existingExecution.testRunId !== testRunId) {
      return NextResponse.json(
        { error: "Test execution does not belong to this test run" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create history record before updating
    await prisma.testExecutionHistory.create({
      data: {
        status: existingExecution.status,
        actualResult: existingExecution.actualResult,
        notes: existingExecution.notes,
        changedById: user.id,
        testExecutionId: existingExecution.id,
      },
    });

    // Update the execution
    const updatedExecution = await prisma.testExecution.update({
      where: { id: executionId },
      data: {
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.actualResult !== undefined && {
          actualResult: parsed.data.actualResult,
        }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
        executedAt: new Date(),
      },
      include: {
        testCase: {
          select: {
            id: true,
            testCaseId: true,
            title: true,
            expectedResult: true,
          },
        },
        executedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updatedExecution);
  } catch (error) {
    console.error("PATCH /api/test-runs/[id]/executions/[executionId] error:", error);
    return NextResponse.json(
      { error: "Failed to update execution" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test-runs/[id]/executions/[executionId]/history
 * Get execution history for a test case within a run.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; executionId: string }> }
) {
  try {
    const session = getSessionFromRequest(_request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: testRunId, executionId } = await params;

    const testRun = await prisma.testRun.findUnique({
      where: { id: testRunId, createdById: session.userId },
    });
    if (!testRun) {
      return NextResponse.json(
        { error: `Test run "${testRunId}" not found` },
        { status: 404 }
      );
    }

    const execution = await prisma.testExecution.findUnique({
      where: { id: executionId },
    });
    if (!execution || execution.testRunId !== testRunId) {
      return NextResponse.json(
        { error: "Test execution not found" },
        { status: 404 }
      );
    }

    const history = await prisma.testExecutionHistory.findMany({
      where: { testExecutionId: executionId },
      include: {
        changedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { changedAt: "asc" },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("GET /api/test-runs/[id]/executions/[executionId]/history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch execution history" },
      { status: 500 }
    );
  }
}
