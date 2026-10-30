"use client";

import { useEffect, useState } from "react";

type DashboardMetrics = {
  testCases: { total: number; byStatus: Record<string, number>; byPriority: Record<string, number> };
  testRuns: { total: number; byStatus: Record<string, number> };
  executions: { total: number; byStatus: Record<string, number>; passRate: number };
  automatedResults: { total: number; bySource: Record<string, number>; individualResultCount: number };
  recentTestRuns: Array<{ id: string; name: string; status: string; suite: string; executions: number; createdBy: string; createdAt: string }>;
  recentAutomatedResults: Array<{ id: string; runName: string; source: string; total: number; passed: number; failed: number; blocked: number; ciUrl: string | null; ciArtifactUrl: string | null; createdBy: string; createdAt: string; individualResults: number }>;
};

type Project = {
  id: string;
  name: string;
  key: string;
};

export default function Home() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects", {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load projects");
      const json = await res.json();
      setProjects(json.data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Read projectId from localStorage or URL query param on mount
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
          if (res.status === 401) { setLoading(false); return; }
          throw new Error("Failed to load dashboard metrics");
        }
        const data: DashboardMetrics = await res.json();
        if (active) setMetrics(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        if (active) setLoading(false);
      }
    }
    void fetchDashboard();
    return () => { active = false; };
  }, [projectId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
        <section className="min-w-0 flex-1 p-5 md:p-8">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <div className="mt-8 px-5 py-8 text-center text-slate-500">Loading dashboard…</div>
        </section>
      </main>
    );
  }

  if (!metrics) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
        <section className="min-w-0 flex-1 p-5 md:p-8">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500 mb-4">Please sign in to view your dashboard metrics.</p>
          </div>
        </section>
      </main>
    );
  }

  const passed = metrics.executions.byStatus.Passed ?? 0;
  const failed = metrics.executions.byStatus.Failed ?? 0;
  const blocked = metrics.executions.byStatus.Blocked ?? 0;
  const totalExecutions = metrics.executions.total;
  const passedPct = totalExecutions > 0 ? Math.round((passed / totalExecutions) * 100) : 0;
  const failedPct = totalExecutions > 0 ? Math.round((failed / totalExecutions) * 100) : 0;
  const blockedPct = totalExecutions > 0 ? Math.round((blocked / totalExecutions) * 100) : 0;

  const sourceColors: Record<string, string> = {
    playwright: "bg-indigo-50 text-indigo-700 border-indigo-100",
    newman: "bg-blue-50 text-blue-700 border-blue-100",
    cypress: "bg-green-50 text-green-700 border-green-100",
    manual: "bg-slate-50 text-slate-700 border-slate-100",
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">Monitor your software testing activity.</p>
          </div>
          <button className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
            + New Test Run
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-slate-700">Project:</span>
            <select
              value={projectId || ""}
              onChange={(e) => {
                const val = e.target.value;
                setProjectId(val || null);
                const params = new URLSearchParams(window.location.search);
                if (val) params.set("projectId", val);
                else params.delete("projectId");
                window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
              }}
              className="block rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              disabled={projectsLoading}
            >
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.key} - {p.name}
                </option>
              ))}
            </select>
            {projectsLoading && <span className="text-xs text-slate-400 italic">Loading…</span>}
          </div>
          {projectId && (
            <p className="text-xs text-slate-500 mt-1">
              Viewing dashboard metrics for selected project.
            </p>
          )}
        </div>

        {!projectId && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              Please select a project to view its dashboard metrics.
            </p>
          </div>
        )}

        {projectId && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Test Cases</p>
                <p className="mt-3 text-3xl font-bold">{metrics.testCases.total}</p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Executions</p>
                <p className="mt-3 text-3xl font-bold">{metrics.executions.total}</p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Pass Rate</p>
                <p className="mt-3 text-3xl font-bold">{passedPct}%</p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Automated Results</p>
                <p className="mt-3 text-3xl font-bold">{metrics.automatedResults.total}</p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Test Runs</p>
                <p className="mt-3 text-3xl font-bold">{metrics.testRuns.total}</p>
              </article>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <article className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
                <h3 className="font-semibold">Execution Overview (Manual)</h3>
                <p className="mt-1 text-sm text-slate-500">Test case results recorded via UI</p>
                <p className="mt-6 text-4xl font-bold">{passedPct}%</p>
                <p className="mt-1 text-sm text-slate-500">Pass rate</p>
                <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full bg-emerald-500`} style={{ width: `${passedPct}%` }} />
                  <div className={`h-full bg-red-500`} style={{ width: `${failedPct}%` }} />
                  <div className={`h-full bg-amber-400`} style={{ width: `${blockedPct}%` }} />
                </div>
                <div className="mt-5 space-y-3 text-sm">
                  <p className="flex justify-between"><span>Passed</span><span className="font-medium">{passedPct}%</span></p>
                  <p className="flex justify-between"><span>Failed</span><span className="font-medium">{failedPct}%</span></p>
                  <p className="flex justify-between"><span>Blocked</span><span className="font-medium">{blockedPct}%</span></p>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-1">
                <h3 className="font-semibold">Automated Results</h3>
                <p className="mt-1 text-sm text-slate-500">CI/Playwright test result submissions</p>
                <p className="mt-6 text-4xl font-bold">{metrics.automatedResults.individualResultCount}</p>
                <p className="mt-1 text-sm text-slate-500">Individual test results</p>
                <div className="mt-5 space-y-3 text-sm">
                  {Object.entries(metrics.automatedResults.bySource).map(
                    ([source, count]) => (
                      <p key={source} className="flex justify-between">
                        <span className={`text-xs font-medium ${sourceColors[source] ?? "text-slate-600"}`}>{source}</span>
                        <span className="font-medium">{count}</span>
                      </p>
                    )
                  )}
                  {Object.keys(metrics.automatedResults.bySource).length === 0 && (
                    <p className="text-xs text-slate-400 text-center">No automated results yet.</p>
                  )}
                </div>
              </article>
            </div>

            <article className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3 bg-slate-50">
                <h3 className="font-semibold">Recent Test Runs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Test Run</th>
                      <th className="px-5 py-3 font-medium">Suite</th>
                      <th className="px-5 py-3 font-medium">Executions</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Created By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metrics.recentTestRuns.map((run) => (
                      <tr key={run.id} className="border-t border-slate-100">
                        <td className="px-5 py-4">
                          <p className="font-medium">{run.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{new Date(run.createdAt).toLocaleString()}</p>
                        </td>
                        <td className="px-5 py-4"><span className="text-xs text-slate-500">{run.suite}</span></td>
                        <td className="px-5 py-4">{run.executions}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${run.status === "Completed" ? "bg-emerald-50 text-emerald-700" : run.status === "InProgress" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-700"}`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{run.createdBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Recent Automated Results</h3>
                  <p className="mt-1 text-xs text-slate-500">CI/Playwright test submissions</p>
                </div>
              </div>
              {metrics.recentAutomatedResults.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500">
                  No automated results yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Run Name</th>
                        <th className="px-5 py-3 font-medium">Source</th>
                        <th className="px-5 py-3 font-medium text-right">Total</th>
                        <th className="px-5 py-3 font-medium text-right">Passed</th>
                        <th className="px-5 py-3 font-medium text-right">Failed</th>
                        <th className="px-5 py-3 font-medium text-right">Blocked</th>
                        <th className="px-5 py-3 font-medium">CI Artifacts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {metrics.recentAutomatedResults.map((result) => (
                        <tr key={result.id} className="border-t border-slate-100">
                          <td className="px-5 py-4">
                            <p className="font-medium">{result.runName}</p>
                            <p className="mt-1 text-xs text-slate-500">{new Date(result.createdAt).toLocaleString()}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sourceColors[result.source] ?? "bg-slate-50 text-slate-600"}`}>{result.source}</span>
                          </td>
                          <td className="px-5 py-4 text-right">{result.total}</td>
                          <td className="px-5 py-4 text-right">{result.passed}</td>
                          <td className="px-5 py-4 text-right">{result.failed}</td>
                          <td className="px-5 py-4 text-right">{result.blocked}</td>
                          <td className="px-5 py-4">
                            {result.ciArtifactUrl ? (
                              <a href={result.ciArtifactUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-700 underline underline-offset-4">View Artifacts</a>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          TestForge · QA Management Platform
        </p>
      </section>
    </main>
  );
}
