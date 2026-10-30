import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

const updateTestRunSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["Planned", "InProgress", "Completed"]).optional(),
  completedAt: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const testRun = await prisma.testRun.findUnique({
      relationLoadStrategy: "join",
      where: { id, createdById: session.userId },
      include: {
        suite: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        executions: {
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
          orderBy: { executedAt: "desc" },
        },
      },
    });

    if (!testRun) {
      return NextResponse.json(
        { error: `Test run "${id}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(testRun);
  } catch (error) {
    console.error("GET /api/test-runs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch test run" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const parsed = updateTestRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.testRun.findUnique({
      where: { id, createdById: session.userId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: `Test run "${id}" not found` },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.description !== undefined)
      data.description = parsed.data.description;
    if (parsed.data.status !== undefined) data.status = parsed.data.status;
    if (parsed.data.completedAt !== undefined) {
      data.completedAt = parsed.data.completedAt
        ? new Date(parsed.data.completedAt)
        : null;
    }

    // Auto-set completedAt when status changes to Completed
    if (
      parsed.data.status === "Completed" &&
      existing.status !== "Completed"
    ) {
      data.completedAt = new Date();
    }

    const testRun = await prisma.testRun.update({
      where: { id },
      data,
      include: {
        suite: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(testRun);
  } catch (error) {
    console.error("PATCH /api/test-runs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update test run" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(_request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    const deletedRunName = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.testRun.findUnique({
        where: { id, createdById: session.userId },
        select: { name: true },
      });

      if (!existing) return null;

      await transaction.testExecutionHistory.deleteMany({
        where: { testExecution: { testRunId: id } },
      });
      await transaction.testExecution.deleteMany({ where: { testRunId: id } });
      await transaction.testRun.delete({ where: { id } });

      return existing.name;
    });

    if (deletedRunName === null) {
      return NextResponse.json(
        { error: `Test run "${id}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Test run deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/test-runs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete test run" },
      { status: 500 }
    );
  }
}
