import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

/**
 * Validation schema for creating/updating a test case.
 * Steps are stored as a JSON string in the database.
 */
const testCaseSchema = z.object({
  testCaseId: z.string().min(1, "Test case ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  preconditions: z.string().optional(),
  steps: z.string().min(1, "Steps are required"),
  expectedResult: z.string().min(1, "Expected result is required"),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  status: z.enum(["Draft", "Active", "Archived"]).default("Draft"),
  suiteId: z.string().optional().nullable(),
});

/**
 * Validation for query parameters on GET.
 */
const querySchema = z
  .object({
    search: z.string().optional(),
    priority: z.string().optional(),
    status: z.string().optional(),
    suiteId: z.string().optional(),
    sortBy: z.string().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    page: z.string().default("1"),
    pageSize: z.string().default("20"),
  })
  .partial();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = querySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      search,
      priority,
      status,
      suiteId,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      pageSize = "20",
    } = parsed.data;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { testCaseId: { contains: search, mode: "insensitive" as const } },
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ];
    }

    if (priority) {
      where.priority = priority;
    }

    if (status) {
      where.status = status;
    }

    if (suiteId) {
      where.suiteId = suiteId;
    }

    const take = Math.min(parseInt(pageSize, 10), 100);
    const skip = (parseInt(page, 10) - 1) * take;

    const [testCases, total] = await prisma.$transaction([
      prisma.testCase.findMany({
        where,
        include: {
          suite: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      prisma.testCase.count({ where }),
    ]);

    return NextResponse.json({
      data: testCases,
      meta: {
        total,
        page: parseInt(page, 10),
        pageSize: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("GET /api/test-cases error:", error);
    return NextResponse.json(
      { error: "Failed to fetch test cases" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = testCaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { suiteId, ...data } = parsed.data;

    // Check for duplicate testCaseId
    const existing = await prisma.testCase.findUnique({
      where: { testCaseId: data.testCaseId },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Test case ID "${data.testCaseId}" already exists` },
        { status: 409 }
      );
    }

    // If a suiteId is provided, verify the suite exists
    if (suiteId) {
      const suite = await prisma.testSuite.findUnique({
        where: { id: suiteId },
      });
      if (!suite) {
        return NextResponse.json(
          { error: `Test suite with id "${suiteId}" not found` },
          { status: 404 }
        );
      }
    }

    // TODO: Replace with the authenticated user's ID once auth is implemented.
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      return NextResponse.json(
        { error: "No users found. Seed the database first." },
        { status: 400 }
      );
    }

    const testCase = await prisma.testCase.create({
      data: {
        ...data,
        suiteId: suiteId ?? null,
        createdById: defaultUser.id,
      },
      include: {
        suite: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(testCase, { status: 201 });
  } catch (error) {
    console.error("POST /api/test-cases error:", error);
    return NextResponse.json(
      { error: "Failed to create test case" },
      { status: 500 }
    );
  }
}
