import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  getActiveSessionUser,
  getCurrentUser,
  getWriteAccessError,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Validation schema for incoming automated test results payload.
 *
 * Expected structure (Playwright results format):
 * {
 *   runName: string,              // e.g. "CI Playwright Run #42"
 *   source: string,               // e.g. "playwright" | "newman"
 *   total: number,                // total test count
 *   passed: number,               // passed count
 *   failed: number,               // failed count
 *   blocked: number,              // blocked count
 *   ciUrl?: string,               // link to CI job
 *   ciArtifactUrl?: string,       // link to CI artifacts
 *   results: [                    // individual test case results
 *     {
 *       testName: string,
 *       status: "passed" | "failed" | "skipped",
 *       durationMs?: number,
 *       errorMessage?: string,     // failure message
 *       errorStack?: string,       // stack trace
 *       screenshotUrl?: string,    // link to screenshot
 *       traceUrl?: string,         // link to trace
 *       ciJobUrl?: string,         // link to specific CI job
 *     }
 *   ]
 * }
 */
const automatedTestCaseResultSchema = z.object({
  testName: z.string().min(1, "Test name is required"),
  status: z.enum(["passed", "failed", "skipped"]),
  durationMs: z.number().int().nonnegative().optional(),
  errorMessage: z.string().optional(),
  errorStack: z.string().optional(),
  screenshotUrl: z.string().url().optional().nullable(),
  traceUrl: z.string().url().optional().nullable(),
  ciJobUrl: z.string().url().optional().nullable(),
});

const automatedTestResultSchema = z.object({
  runName: z.string().min(1, "Run name is required"),
  source: z.string().min(1, "Source is required"),
  total: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  blocked: z.number().int().nonnegative(),
  ciUrl: z.string().url().optional().nullable(),
  ciArtifactUrl: z.string().url().optional().nullable(),
  results: z.array(automatedTestCaseResultSchema).min(1, "At least one result is required"),
});

/**
 * POST /api/automated-results
 *
 * Receives automated test results from CI (Playwright, Newman, etc.).
 * Requires authentication via session cookie.
 *
 * Validates:
 * - Authentication (401 if no session)
 * - Payload structure (400 if malformed)
 * - Duplicate submissions (409 if same runName+source already exists)
 *
 * Stores:
 * - AutomatedTestResult (summary)
 * - AutomatedTestCaseResult (individual test results, linked to summary)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await getActiveSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const writeError = getWriteAccessError(session);
    if (writeError) return writeError;

    const body = await request.json();
    const parsed = automatedTestResultSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { runName, source, results, ...summaryData } = parsed.data;

    const user = await getCurrentUser(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for duplicate submission (same runName + source)
    const existing = await prisma.automatedTestResult.findFirst({
      where: {
        runName,
        source,
        createdById: user.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Duplicate submission: automated result "${runName}" from source "${source}" already exists.`,
          existingId: existing.id,
        },
        { status: 409 }
      );
    }

    // Create the automated test result summary and individual results in a transaction
    const automatedResult = await prisma.automatedTestResult.create({
      data: {
        runName,
        source,
        total: summaryData.total,
        passed: summaryData.passed,
        failed: summaryData.failed,
        blocked: summaryData.blocked,
        ciUrl: summaryData.ciUrl ?? null,
        ciArtifactUrl: summaryData.ciArtifactUrl ?? null,
        createdById: user.id,
        results: {
          create: results.map((r) => ({
            testName: r.testName,
            status: r.status,
            durationMs: r.durationMs ?? null,
            errorMessage: r.errorMessage ?? null,
            errorStack: r.errorStack ?? null,
            screenshotUrl: r.screenshotUrl ?? null,
            traceUrl: r.traceUrl ?? null,
            ciJobUrl: r.ciJobUrl ?? null,
          })),
        },
      },
      include: {
        results: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(
      {
        message: "Automated test results received successfully",
        id: automatedResult.id,
        runName: automatedResult.runName,
        source: automatedResult.source,
        total: automatedResult.total,
        passed: automatedResult.passed,
        failed: automatedResult.failed,
        blocked: automatedResult.blocked,
        resultCount: automatedResult.results.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/automated-results error:", error);
    return NextResponse.json(
      { error: "Failed to process automated test results" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/automated-results
 *
 * Lists automated test results for the authenticated user.
 * Supports filtering by source and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getActiveSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || undefined;

    const take = Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100);
    const skip = (parseInt(searchParams.get("page") || "1", 10) - 1) * take;

    const [results, total] = await prisma.$transaction([
      prisma.automatedTestResult.findMany({
        where: {
          createdById: session.userId,
          ...(source ? { source } : {}),
        },
        include: {
          _count: { select: { results: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.automatedTestResult.count({
        where: {
          createdById: session.userId,
          ...(source ? { source } : {}),
        },
      }),
    ]);

    return NextResponse.json({
      data: results,
      meta: {
        total,
        page: Math.floor(skip / take) + 1,
        pageSize: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("GET /api/automated-results error:", error);
    return NextResponse.json(
      { error: "Failed to fetch automated results" },
      { status: 500 }
    );
  }
}
