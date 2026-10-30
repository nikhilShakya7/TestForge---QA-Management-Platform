import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getActiveSessionUser, isSuperAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { USER_ROLES } from "@/lib/roles";

const updateUserSchema = z
  .object({
    role: z.enum(USER_ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.isActive !== undefined);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getActiveSessionUser(request);
    if (!actor) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!isSuperAdmin(actor)) {
      return NextResponse.json({ error: "Super Admin access required" }, { status: 403 });
    }

    const parsed = updateUserSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid user update", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = await params;
    const updatedUser = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id },
        select: { id: true, role: true, isActive: true },
      });

      if (!target) {
        throw new Error("USER_NOT_FOUND");
      }

      const willRemainActiveSuperAdmin =
        (parsed.data.role ?? target.role) === "SUPER_ADMIN" &&
        (parsed.data.isActive ?? target.isActive);

      if (target.role === "SUPER_ADMIN" && target.isActive && !willRemainActiveSuperAdmin) {
        const activeSuperAdmins = await tx.user.count({
          where: { role: "SUPER_ADMIN", isActive: true },
        });

        if (activeSuperAdmins <= 1) {
          throw new Error("LAST_SUPER_ADMIN");
        }
      }

      return tx.user.update({
        where: { id },
        data: parsed.data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "LAST_SUPER_ADMIN") {
      return NextResponse.json(
        { error: "The last active Super Admin cannot be demoted or deactivated." },
        { status: 409 }
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "This update conflicted with another role change. Please retry." },
        { status: 409 }
      );
    }

    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
