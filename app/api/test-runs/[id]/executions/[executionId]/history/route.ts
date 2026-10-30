import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/test-runs/[id]/executions/[executionId]/history
 * Get execution history for a test case within a test run.
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
