import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  getActiveSessionUser,
  canAccessProject,
  canManageProject,
  getWriteAccessError,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

const updateDefectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  reproSteps: z.string().optional().nullable(),
  expectedResult: z.string().optional().nullable(),
  actualResult: z.string().optional().nullable(),
  severity: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  status: z.enum(["Open", "InProgress", "Resolved", "Closed"]).optional(),
  testCaseId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const { id } = await params;

    // Check if user can access this defect (via project access)
    const defectRecord = await prisma.defect.findUnique({
      where: { id },
      include: {
        testCase: { select: { id: true, testCaseId: true, title: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    if (!defectRecord) {
      return NextResponse.json(
        { error: `Defect "${id}" not found` },
        { status: 404 }
      );
    }

    const projectId = defectRecord.projectId || "";
    // Verify user has access to the project the defect belongs to
    const projectAccess = await canAccessProject(session, projectId);
    if (!projectAccess) {
      return NextResponse.json(
        { error: "You do not have access to this project" },
        { status: 403 }
      );
    }

    return NextResponse.json(defectRecord);
  } catch (error) {
    console.error("GET /api/defects/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch defect" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const writeError = getWriteAccessError(session);
    if (writeError) return writeError;

    const { id } = await params;

    const body = await request.json();
    const parsed = updateDefectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if user can manage this project
    const defectRecord = await prisma.defect.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!defectRecord) {
      return NextResponse.json(
        { error: `Defect "${id}" not found` },
        { status: 404 }
      );
    }

    const projectId = defectRecord.projectId || "";
    // Check project management permissions
    const canManage = await canManageProject(session, projectId);
    if (!canManage) {
      return NextResponse.json(
        { error: "You do not have permission to modify defects in this project" },
        { status: 403 }
      );
    }

    // If testCaseId is provided and changed, verify it exists
    if (parsed.data.testCaseId !== undefined && parsed.data.testCaseId !== null) {
      const testCase = await prisma.testCase.findUnique({
        where: { id: parsed.data.testCaseId },
      });
      if (!testCase) {
        return NextResponse.json(
          { error: `Test case "${parsed.data.testCaseId}" not found` },
          { status: 404 }
        );
      }
    }

    // If assigneeId is provided, verify the user exists and is a project member
    if (parsed.data.assigneeId !== undefined && parsed.data.assigneeId !== null) {
      const assignee = await prisma.user.findUnique({
        where: { id: parsed.data.assigneeId },
      });
      if (!assignee) {
        return NextResponse.json(
          { error: `User "${parsed.data.assigneeId}" not found` },
          { status: 404 }
        );
      }
      // Check if assignee is a project member
      const membership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: parsed.data.assigneeId,
            projectId,
          },
        },
      });
      if (!membership) {
        return NextResponse.json(
          { error: "Assignee must be a member of the project" },
          { status: 403 }
        );
      }
    }

    const updatedDefect = await prisma.defect.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.reproSteps !== undefined && { reproSteps: parsed.data.reproSteps }),
        ...(parsed.data.expectedResult !== undefined && { expectedResult: parsed.data.expectedResult }),
        ...(parsed.data.actualResult !== undefined && { actualResult: parsed.data.actualResult }),
        ...(parsed.data.severity !== undefined && { severity: parsed.data.severity }),
        ...(parsed.data.priority !== undefined && { priority: parsed.data.priority }),
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.testCaseId !== undefined && { testCaseId: parsed.data.testCaseId }),
        ...(parsed.data.assigneeId !== undefined && { assigneeId: parsed.data.assigneeId }),
      },
      include: {
        testCase: { select: { id: true, testCaseId: true, title: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updatedDefect);
  } catch (error) {
    console.error("PATCH /api/defects/[id] error:", error);
    return NextResponse.json({ error: "Failed to update defect" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const writeError = getWriteAccessError(session);
    if (writeError) return writeError;

    const { id } = await params;

    const defectRecord = await prisma.defect.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!defectRecord) {
      return NextResponse.json(
        { error: `Defect "${id}" not found` },
        { status: 404 }
      );
    }

    const projectId = defectRecord.projectId || "";
    // Check delete permissions (only creator or admin can delete)
    const isCreator = defectRecord.reportedById === session.userId;
    const isAdmin = await canManageProject(session, projectId);

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to delete this defect" },
        { status: 403 }
      );
    }

    await prisma.defect.delete({ where: { id } });

    return NextResponse.json({ message: "Defect deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/defects/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete defect" }, { status: 500 });
  }
}
