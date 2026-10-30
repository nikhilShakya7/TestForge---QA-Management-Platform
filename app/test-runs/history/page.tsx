"use client";

import { useEffect, useState, useCallback } from "react";
import TestRunCard from "@/components/cards/test-run-card";
import TestResultCard from "@/components/cards/test-result-card";

type TestRun = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  suiteId: string | null;
  projectId: string | null;
  createdById: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  suite: {
    id: string;
    name: string;
    _count?: { testCases: number };
  } | null;
  project?: { _count?: { testCases: number } } | null;
  _count: {
    executions: number;
    executions_by_status: {
      passed: number;
      failed: number;
      blocked: number;
    };
  };
};

type Project = {
  id: string;
  name: string;
  key: string;
};

type ExecutionStatus = "Passed" | "Failed" | "Blocked";

type ExecutionRecord = {
  id: string;
  testCaseId: string;
  status: ExecutionStatus;
  actualResult: string | null;
  notes: string | null;
  executedAt: string;
  executedBy: { id: string; name: string | null; email: string } | null;
  testCase: {
    id: string;
    testCaseId: string;
    title: string;
    expectedResult: string | null;
  } | null;
};

export default function TestRunsHistoryPage() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [executionsLoading, setExecutionsLoading] = useState(false);

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

  const fetchTestRuns = useCallback(async () => {
    if (!projectId) {
      setTestRuns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/test-runs?projectId=${projectId}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load test runs");
      const data: TestRun[] = await res.json();
      setTestRuns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load test runs");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTestRuns();
  }, [projectId]);

  const fetchExecutions = async (runId: string) => {
    setExecutionsLoading(true);
    try {
      const res = await fetch(`/api/test-runs/${runId}/executions`, {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load executions");
      const data: ExecutionRecord[] = await res.json();
      setExecutions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load executions",
      );
    } finally {
      setExecutionsLoading(false);
    }
  };

  const handleSelectRun = (run: TestRun) => {
    setSelectedRun(run);
    setExecutions([]);
    fetchExecutions(run.id);
  };

  const handleCloseRunDetail = () => {
    setSelectedRun(null);
    setExecutions([]);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Test Execution History</h1>
            <p className="mt-1 text-sm text-slate-500">
              View all test execution runs and their results.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/test-runs")}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            ← Back to Test Runs
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
                localStorage.setItem("testforge_projectId", val || "");
                const params = new URLSearchParams(window.location.search);
                if (val) params.set("projectId", val);
                else params.delete("projectId");
                window.history.replaceState(
                  {},
                  "",
                  `${window.location.pathname}?${params.toString()}`,
                );
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
            {projectsLoading && (
              <span className="text-xs text-slate-400 italic">Loading…</span>
            )}
          </div>
          {projectId && (
            <p className="text-xs text-slate-500 mt-1">
              Viewing execution history for selected project.
            </p>
          )}
        </div>

        {!projectId && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              Please select a project to view test execution history.
            </p>
          </div>
        )}

        {projectId && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3 bg-slate-50">
              <h3 className="font-semibold">Test Execution History</h3>
              <p className="mt-1 text-xs text-slate-500">
                All test execution runs for this project.
              </p>
            </div>

            {loading ? (
              <div className="px-5 py-8 text-center text-slate-500">
                Loading test runs…
              </div>
            ) : testRuns.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-500">
                No test runs found for this project.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {testRuns.map((run) => (
                  <TestRunCard
                    key={run.id}
                    run={run}
                    onView={() => handleSelectRun(run)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {selectedRun && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  Execution Results: {selectedRun.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Individual test case results for this run.
                </p>
              </div>
              <button
                onClick={handleCloseRunDetail}
                className="text-xs text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
              >
                ← Back to List
              </button>
            </div>

            <div className="p-5">
              {executionsLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading execution results…
                </p>
              ) : executions.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No execution results found for this run.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {executions.map((execution) => (
                    <TestResultCard
                      key={execution.id}
                      testCaseId={
                        execution.testCase?.testCaseId || execution.testCaseId
                      }
                      title={execution.testCase?.title || "Test case"}
                      status={execution.status}
                      expectedResult={execution.testCase?.expectedResult}
                      actualResult={execution.actualResult}
                      notes={execution.notes}
                      executedAt={execution.executedAt}
                      executedBy={
                        execution.executedBy?.name ||
                        execution.executedBy?.email
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
