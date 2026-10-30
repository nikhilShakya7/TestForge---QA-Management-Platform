import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";

const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((email) => email.toLowerCase()),
  name: z.string().trim().min(1, "Name is required").max(100),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  invitationToken: z.string().min(1).optional(),
});

function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name, password, invitationToken } = parsed.data;
    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(
      async (tx) => {
        if (invitationToken) {
          const invitation = await tx.invitation.findFirst({
            where: {
              tokenHash: hashInvitationToken(invitationToken),
              status: "PENDING",
              expiresAt: { gt: new Date() },
            },
          });

          if (!invitation || invitation.email.toLowerCase() !== email) {
            throw new Error("INVITATION_INVALID");
          }

          const createdUser = await tx.user.create({
            data: {
              email,
              name,
              passwordHash,
              role: invitation.role,
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true,
            },
          });

          await tx.invitation.update({
            where: { id: invitation.id },
            data: { status: "ACCEPTED", acceptedAt: new Date() },
          });

          return createdUser;
        }

        const userCount = await tx.user.count();
        return tx.user.create({
          data: {
            email,
            name,
            passwordHash,
            role: userCount === 0 ? "SUPER_ADMIN" : "QA_TESTER",
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return NextResponse.json(
      { message: "Account created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "INVITATION_INVALID") {
      return NextResponse.json(
        { error: "This invitation is invalid, expired, or for a different email address." },
        { status: 400 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Registration conflicted with another signup. Please try again." },
        { status: 409 }
      );
    }

    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
