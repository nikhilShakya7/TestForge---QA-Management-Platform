"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Bug,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Clock3,
  FlaskConical,
  FolderKanban,
  Layers3,
  Play,
  Plus,
  ShieldAlert,
  Sparkles,
  TestTube2,
  XCircle,
} from "lucide-react";
import StatusBadge from "@/components/cards/status-badge";

type DashboardMetrics = {
  testCases: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
  testRuns: { total: number; byStatus: Record<string, number> };
  executions: {
    total: number;
    byStatus: Record<string, number>;
    passRate: number;
  };
  automatedResults: {
    total: number;
    bySource: Record<string, number>;
    individualResultCount: number;
  };
  recentTestRuns: Array<{
    id: string;
    name: string;
    status: string;
    suite: string;
    executions: number;
    createdBy: string;
    createdAt: string;
  }>;
  recentAutomatedResults: Array<{
    id: string;
    runName: string;
    source: string;
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    ciUrl: string | null;
    ciArtifactUrl: string | null;
    createdBy: string;
    createdAt: string;
    individualResults: number;
  }>;
};

type Project = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: string;
  passRate: number;
  createdAt: string;
  _count: { testCases: number; testRuns: number; defects: number };
};

const sourceStyles: Record<string, string> = {
  playwright: "border-violet-200 bg-violet-50 text-violet-700",
  newman: "border-blue-200 bg-blue-50 text-blue-700",
  cypress: "border-emerald-200 bg-emerald-50 text-emerald-700",
  manual: "border-slate-200 bg-slate-100 text-slate-700",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <section className="mx-auto w-full max-w-[1600px] p-5 md:p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>

        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-10 w-56 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <Skeleton className="mt-6 h-9 w-20" />
              <Skeleton className="mt-3 h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-3 w-64" />
            <Skeleton className="mt-8 h-10 w-28" />
            <Skeleton className="mt-5 h-3 w-full rounded-full" />
            <div className="mt-7 grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-3 w-52" />
            <Skeleton className="mt-8 h-10 w-24" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-5 w-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-7">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="mt-2 h-4 w-64" />
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-5 w-40" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-3/4" />
                <Skeleton className="mt-6 h-16 w-full rounded-xl" />
                <Skeleton className="mt-4 h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <Skeleton className="h-5 w-40" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 3 }).map((__, row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: typeof FolderKanban;
  iconClass: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>
      </div>
      <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </article>
  );
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTotal, setProjectTotal] = useState(0);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects?pageSize=100", {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load projects");
      const json = await res.json();
      setProjects(json.data || []);
      setProjectTotal(json.meta?.total ?? json.data?.length ?? 0);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("testforge_projectId");
      const params = new URLSearchParams(window.location.search);
      const pid = params.get("projectId") || stored || null;
      if (pid) {
        setProjectId(pid);
        localStorage.setItem("testforge_projectId", pid);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (projectId) params.set("projectId", projectId);

        const res = await fetch(`/api/dashboard?${params.toString()}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 401) {
            setLoading(false);
            return;
          }
          throw new Error("Failed to load dashboard metrics");
        }

        const data: DashboardMetrics = await res.json();
        if (active) setMetrics(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchDashboard();
    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) return <DashboardSkeleton />;

  if (!metrics) {
    return (
      <main className="min-h-screen bg-[#f7f8fc] p-5 text-slate-900 md:p-8">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FlaskConical size={26} />
          </div>
          <h2 className="mt-5 text-xl font-semibold">Welcome to TestForge</h2>
          <p className="mt-2 text-sm text-slate-500">
            Please sign in to view your dashboard metrics.
          </p>
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Sign in
          </button>
        </section>
      </main>
    );
  }

  const passed = metrics.executions.byStatus.Passed ?? 0;
  const failed = metrics.executions.byStatus.Failed ?? 0;
  const blocked = metrics.executions.byStatus.Blocked ?? 0;
  const totalExecutions = metrics.executions.total;
  const passedPct =
    totalExecutions > 0 ? Math.round((passed / totalExecutions) * 100) : 0;
  const failedPct =
    totalExecutions > 0 ? Math.round((failed / totalExecutions) * 100) : 0;
  const blockedPct =
    totalExecutions > 0 ? Math.round((blocked / totalExecutions) * 100) : 0;

  const recentActivity = [
    ...metrics.recentTestRuns.map((run) => ({
      id: `run-${run.id}`,
      label: run.name,
      detail: `Test run · ${run.status} · ${run.executions} execution(s) · ${run.createdBy}`,
      createdAt: run.createdAt,
      source: "Test Run",
    })),
    ...metrics.recentAutomatedResults.map((result) => ({
      id: `automated-${result.id}`,
      label: result.runName,
      detail: `${result.source} · ${result.passed} passed · ${result.failed} failed · ${result.blocked} blocked`,
      createdAt: result.createdAt,
      source: result.source,
    })),
  ]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <section className="mx-auto w-full max-w-[1600px] p-5 md:p-8">
        {/* Page heading */}
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
              <Sparkles size={14} />
              Overview
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor your testing progress and project quality in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams();
              if (projectId) params.set("projectId", projectId);
              router.push(`/test-runs?${params.toString()}`);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
          >
            <Plus size={17} />
            New Test Run
          </button>
        </header>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <ShieldAlert size={17} />
            {error}
          </div>
        )}

        {/* Project selector */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <FolderKanban size={19} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Project workspace
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {projectId
                  ? "Showing metrics for the selected project"
                  : "Choose a project to view its metrics"}
              </p>
            </div>
          </div>
          <select
            value={projectId || ""}
            onChange={(e) => {
              const val = e.target.value;
              setProjectId(val || null);
              localStorage.setItem("testforge_projectId", val || "");
              const params = new URLSearchParams(window.location.search);
              if (val) params.set("projectId", val);
              else params.delete("projectId");
              const query = params.toString();
              window.history.replaceState(
                {},
                "",
                query
                  ? `${window.location.pathname}?${query}`
                  : window.location.pathname,
              );
            }}
            className="min-w-56 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:opacity-60"
            disabled={projectsLoading}
          >
            <option value="">Select a project…</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.key} - {project.name}
              </option>
            ))}
          </select>
        </div>

        {!projectId && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <CircleDot size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              Select a project to see its test metrics, execution overview, and
              recent results.
            </p>
          </div>
        )}

        {projectId && (
          <>
            {/* Metric cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total Projects"
                value={projectTotal}
                helper="Projects in your workspace"
                icon={FolderKanban}
                iconClass="bg-indigo-50 text-indigo-600"
              />
              <MetricCard
                label="Test Cases"
                value={metrics.testCases.total}
                helper="Cases in selected project"
                icon={ClipboardCheck}
                iconClass="bg-blue-50 text-blue-600"
              />
              <MetricCard
                label="Test Runs"
                value={metrics.testRuns.total}
                helper="Runs in selected project"
                icon={Play}
                iconClass="bg-violet-50 text-violet-600"
              />
              <MetricCard
                label="Overall Pass Rate"
                value={`${passedPct}%`}
                helper={`${passed} of ${totalExecutions} executions passed`}
                icon={CheckCircle2}
                iconClass="bg-emerald-50 text-emerald-600"
              />
            </div>

            {/* Execution overview */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] lg:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Execution overview
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Manual test execution results
                    </p>
                  </div>
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                    {totalExecutions} total executions
                  </span>
                </div>

                <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-4xl font-bold tracking-tight text-slate-950">
                      {passedPct}%
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Pass rate</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">
                      {passed} passed
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Out of {totalExecutions} executions
                    </p>
                  </div>
                </div>

                <div
                  className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100"
                  role="img"
                  aria-label={`${passedPct}% passed, ${failedPct}% failed, ${blockedPct}% blocked`}
                >
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${passedPct}%` }}
                  />
                  <div
                    className="h-full bg-rose-500 transition-all"
                    style={{ width: `${failedPct}%` }}
                  />
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{ width: `${blockedPct}%` }}
                  />
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-emerald-50/70 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                      <CheckCircle2 size={15} /> Passed
                    </div>
                    <p className="mt-2 text-xl font-bold text-emerald-800">
                      {passed}
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-700/70">
                      {passedPct}% of total
                    </p>
                  </div>
                  <div className="rounded-xl bg-rose-50/70 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-rose-700">
                      <XCircle size={15} /> Failed
                    </div>
                    <p className="mt-2 text-xl font-bold text-rose-800">
                      {failed}
                    </p>
                    <p className="mt-0.5 text-xs text-rose-700/70">
                      {failedPct}% of total
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50/70 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
                      <ShieldAlert size={15} /> Blocked
                    </div>
                    <p className="mt-2 text-xl font-bold text-amber-800">
                      {blocked}
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700/70">
                      {blockedPct}% of total
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Automated results
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      CI test submissions
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <TestTube2 size={19} />
                  </div>
                </div>
                <p className="mt-7 text-4xl font-bold tracking-tight text-slate-950">
                  {metrics.automatedResults.individualResultCount}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Individual test results
                </p>
                <div className="mt-6 space-y-3">
                  {Object.entries(metrics.automatedResults.bySource).map(
                    ([source, count]) => (
                      <div
                        key={source}
                        className="flex items-center justify-between gap-3"
                      >
                        <span
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${sourceStyles[source] ?? sourceStyles.manual}`}
                        >
                          {source}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">
                          {count}
                        </span>
                      </div>
                    ),
                  )}
                  {Object.keys(metrics.automatedResults.bySource).length ===
                    0 && (
                    <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                      No automated results yet.
                    </p>
                  )}
                </div>
              </article>
            </div>

            {/* Projects */}
            <section className="mt-8">
              <SectionHeading
                title="Project overview"
                description="A quick look at project health and test coverage."
              />
              {projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <FolderKanban className="mx-auto text-slate-300" size={28} />
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    No projects available
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Create a project to start organizing your tests.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {projects.slice(0, 3).map((project) => (
                    <article
                      key={project.id}
                      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="h-1 bg-indigo-500" />
                      <div className="p-5">
                        <header className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                              <Layers3 size={19} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                                {project.key}
                              </p>
                              <h4 className="mt-0.5 truncate font-semibold text-slate-900">
                                {project.name}
                              </h4>
                            </div>
                          </div>
                          <StatusBadge status={project.status} />
                        </header>
                        <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-relaxed text-slate-500">
                          {project.description ||
                            "No project description provided."}
                        </p>
                        <dl className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-xl bg-slate-50 py-3 text-center">
                          <div>
                            <dt className="text-xs text-slate-500">Cases</dt>
                            <dd className="mt-1 text-base font-bold text-slate-800">
                              {project._count.testCases}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500">Runs</dt>
                            <dd className="mt-1 text-base font-bold text-slate-800">
                              {project._count.testRuns}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500">
                              Pass rate
                            </dt>
                            <dd className="mt-1 text-base font-bold text-slate-800">
                              {project.passRate}%
                            </dd>
                          </div>
                        </dl>
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.setItem(
                              "testforge_projectId",
                              project.id,
                            );
                            router.push(`/test-cases?projectId=${project.id}`);
                          }}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          Open project <ArrowUpRight size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Recent test runs and automated results */}
            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Recent test runs
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Latest manual test activity
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Play size={17} />
                  </div>
                </div>
                {metrics.recentTestRuns.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    No test runs yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {metrics.recentTestRuns.map((run) => (
                      <div
                        key={run.id}
                        className="flex items-start justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/70"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {run.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {run.suite} · {run.executions} execution(s)
                          </p>
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock3 size={12} /> {formatDate(run.createdAt)} ·{" "}
                            {run.createdBy}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <StatusBadge status={run.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Recent automated results
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Latest CI and automation submissions
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <FlaskConical size={17} />
                  </div>
                </div>
                {metrics.recentAutomatedResults.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">
                    No automated results yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {metrics.recentAutomatedResults.map((result) => (
                      <div
                        key={result.id}
                        className="px-5 py-4 transition hover:bg-slate-50/70"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {result.runName}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatDate(result.createdAt)} ·{" "}
                              {result.createdBy}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-semibold ${sourceStyles[result.source] ?? sourceStyles.manual}`}
                          >
                            {result.source}
                          </span>
                        </div>
                        <dl className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                          <div>
                            <dt className="text-[11px] text-slate-500">
                              Total
                            </dt>
                            <dd className="mt-1 text-sm font-bold text-slate-800">
                              {result.total}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-slate-500">
                              Passed
                            </dt>
                            <dd className="mt-1 text-sm font-bold text-emerald-700">
                              {result.passed}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-slate-500">
                              Failed
                            </dt>
                            <dd className="mt-1 text-sm font-bold text-rose-700">
                              {result.failed}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-slate-500">
                              Blocked
                            </dt>
                            <dd className="mt-1 text-sm font-bold text-amber-700">
                              {result.blocked}
                            </dd>
                          </div>
                        </dl>
                        {result.ciArtifactUrl && (
                          <a
                            href={result.ciArtifactUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            View artifacts <ArrowUpRight size={13} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>

            {/* Recent activity */}
            <article className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Activity size={17} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Recent activity
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    A combined timeline of recent testing events
                  </p>
                </div>
              </div>
              {recentActivity.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  No recent activity.
                </p>
              ) : (
                <ol className="divide-y divide-slate-100 px-5">
                  {recentActivity.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-4"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          {activity.source === "Test Run" ? (
                            <Play size={15} />
                          ) : (
                            <Bug size={15} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {activity.label}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {activity.detail}
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 text-xs text-slate-400">
                        {activity.source} · {formatDate(activity.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </article>
          </>
        )}

        <footer className="py-8 text-center text-xs font-medium text-slate-400">
          TestForge · QA Management Platform
        </footer>
      </section>
    </main>
  );
}
