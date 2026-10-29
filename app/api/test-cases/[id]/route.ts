import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if the test case exists
    const existing = await prisma.testCase.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Test case with id "${id}" not found` },
        { status: 404 }
      );
    }

    // Check if test executions reference this test case
    const executionCount = await prisma.testExecution.count({
      where: { testCaseId: id },
    });

    if (executionCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete test case "${existing.testCaseId}": it is referenced by ${executionCount} test execution(s). Remove those executions first.`,
        },
        { status: 409 }
      );
    }

    // Check if defects reference this test case
    const defectCount = await prisma.defect.count({
      where: { testCaseId: id },
    });

    if (defectCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete test case "${existing.testCaseId}": it is referenced by ${defectCount} defect(s). Remove those defects first.`,
        },
        { status: 409 }
      );
    }

    await prisma.testCase.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Test case deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/test-cases/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete test case" },
      { status: 500 }
    );
  }
}
