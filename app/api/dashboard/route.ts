import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/dashboard
 *
 * Returns aggregated testing metrics for the authenticated user only:
 * - Total test cases, by status and priority
 * - Total test runs, by status
 * - Total executions, by result (Passed/Failed/Blocked)
 * - Recent test runs with execution counts
 */
export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = session.userId;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;

    const baseWhere = {
      ...(projectId ? { projectId } : {}),
    };

    // Test case counts (filtered by user and project)
    const [totalTestCases, testCasesByStatus, testCasesByPriority] =
      await Promise.all([
        prisma.testCase.count({
          where: { createdById: userId, ...baseWhere },
        }),
        prisma.testCase.groupBy({
          by: ["status"],
          _count: { status: true },
          where: { createdById: userId, ...baseWhere },
        }),
        prisma.testCase.groupBy({
          by: ["priority"],
          _count: { priority: true },
          where: { createdById: userId, ...baseWhere },
        }),
      ]);

    // Test run counts (filtered by user and project)
    const [totalTestRuns, testRunsByStatus] = await Promise.all([
      prisma.testRun.count({
        where: { createdById: userId, ...baseWhere },
      }),
      prisma.testRun.groupBy({
        by: ["status"],
        _count: { status: true },
        where: { createdById: userId, ...baseWhere },
      }),
    ]);

    // Execution counts — executions belong to test runs, which belong to users
    // Filter executions by runs created by this user and project
    const [totalExecutions, executionsByStatus] = await Promise.all([
      prisma.testExecution.count({
        where: { testRun: { createdById: userId, ...baseWhere } },
      }),
      prisma.testExecution.groupBy({
        by: ["status"],
        _count: { status: true },
        where: { testRun: { createdById: userId, ...baseWhere } },
      }),
    ]);

    // Helper to convert groupBy results to a simple record
    const toRecord = (
      arr: Array<{ status?: string; priority?: string; _count: { [key: string]: number } }>
    ) => {
      const record: Record<string, number> = {};
      arr.forEach((item) => {
        const key = item.status ?? item.priority ?? "unknown";
        record[key] = item._count.status ?? item._count.priority ?? 0;
      });
      return record;
    };

    // Recent test runs (last 5) with execution counts (filtered by user and project)
    const recentTestRuns = await prisma.testRun.findMany({
      take: 5,
      where: { createdById: userId, ...baseWhere },
      orderBy: { createdAt: "desc" },
      include: {
        suite: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
        _count: { select: { executions: true } },
      },
    });

    const passedCount = executionsByStatus.find((e) => e.status === "Passed")?._count.status ?? 0;
    const passRate = totalExecutions > 0 ? Math.round((passedCount / totalExecutions) * 100) : 0;

    // Automated test results (Playwright, Newman, etc.)
    const [totalAutomatedResults, automatedResultsBySource, automatedResultCount] =
      await Promise.all([
        prisma.automatedTestResult.count({
          where: { createdById: userId, ...baseWhere },
        }),
        prisma.automatedTestResult.groupBy({
          by: ["source"],
          _count: { source: true },
          where: { createdById: userId, ...baseWhere },
        }),
        prisma.automatedTestCaseResult.aggregate({
          where: {
            automatedResult: { createdById: userId, ...baseWhere },
          },
          _count: { _all: true },
        }),
      ]);

    const automatedBySource: Record<string, number> = {};
    automatedResultsBySource.forEach((item) => {
      automatedBySource[item.source] = item._count.source;
    });

    // Recent automated results (last 5)
    const recentAutomatedResults = await prisma.automatedTestResult.findMany({
      take: 5,
      where: { createdById: userId, ...baseWhere },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { results: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      testCases: {
        total: totalTestCases,
        byStatus: toRecord(testCasesByStatus),
        byPriority: toRecord(testCasesByPriority),
      },
      testRuns: {
        total: totalTestRuns,
        byStatus: toRecord(testRunsByStatus),
      },
      executions: {
        total: totalExecutions,
        byStatus: toRecord(executionsByStatus),
        passRate,
      },
      automatedResults: {
        total: totalAutomatedResults,
        bySource: automatedBySource,
        individualResultCount: automatedResultCount._count._all,
      },
      recentTestRuns: recentTestRuns.map((run) => ({
        id: run.id,
        name: run.name,
        status: run.status,
        suite: run.suite?.name ?? "—",
        executions: run._count.executions,
        createdBy: run.createdBy?.name ?? run.createdBy?.email ?? "—",
        createdAt: run.createdAt,
      })),
      recentAutomatedResults: recentAutomatedResults.map((result) => ({
        id: result.id,
        runName: result.runName,
        source: result.source,
        total: result.total,
        passed: result.passed,
        failed: result.failed,
        blocked: result.blocked,
        ciUrl: result.ciUrl,
        ciArtifactUrl: result.ciArtifactUrl,
        createdBy: result.createdBy?.name ?? result.createdBy?.email ?? "—",
        createdAt: result.createdAt,
        individualResults: result._count.results,
      })),
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics" }, { status: 500 });
  }
}
