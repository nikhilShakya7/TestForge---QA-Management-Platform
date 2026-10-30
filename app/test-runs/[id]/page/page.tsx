"use client";

import { useEffect, useState } from "react";

type TestRun = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  suiteId: string | null;
  projectId: string | null;
  suite: { id: string; name: string } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
  executions: Array<{
    id: string;
    testCaseId: string;
    status: string;
    executedAt: string;
    notes: string | null;
    executedBy: { id: string; name: string | null; email: string } | null;
    testCase: { id: string; testCaseId: string; title: string } | null;
  }>;
};

export default function TestRunDetailPage() {
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const testRunId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("id")
    : null;

  useEffect(() => {
    if (!testRunId) return;

    async function fetchTestRun() {
      try {
        const res = await fetch(`/api/test-runs/${testRunId}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load test run");
        const data: TestRun = await res.json();
        setTestRun(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load test run");
      } finally {
        setLoading(false);
      }
    }

    void fetchTestRun();
  }, [testRunId]);

  const handleDelete = async () => {
    if (!testRunId || !testRun) return;
    if (
      !window.confirm(
        `Delete test run "${testRun.name}" and all its execution results and history? This cannot be undone.`
      )
    ) return;

    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/test-runs/${testRunId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete test run");
      }
      window.location.href = "/test-runs";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete test run");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
        <section className="min-w-0 flex-1 p-5 md:p-8">
          <h2 className="text-2xl font-bold">Test Run</h2>
          <div className="mt-8 px-5 py-8 text-center text-slate-500">
            Loading test run…
          </div>
        </section>
      </main>
    );
  }

  if (!testRun) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
        <section className="min-w-0 flex-1 p-5 md:p-8">
          <h2 className="text-2xl font-bold">Test Run</h2>
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button
              onClick={() => (window.location.href = "/test-runs")}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Back to Test Runs
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{testRun.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Test execution run details
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete Test Run"}
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                window.location.href = `/test-runs?${params.toString()}`;
              }}
              className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
            >
              Back to List
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Test Run Name</p>
            <p className="mt-1 text-sm font-medium">{testRun.name}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-1 text-sm font-medium">
              <span className={`rounded-full px-2 py-1 text-xs ${testRun.status === "Completed" ? "bg-emerald-50 text-emerald-700" : testRun.status === "InProgress" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-700"}`}>
                {testRun.status}
              </span>
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Test Suite</p>
            <p className="mt-1 text-sm font-medium">
              {testRun.suite?.name || "No suite"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Executions</p>
            <p className="mt-1 text-sm font-medium">{testRun.executions.length}</p>
          </article>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3 bg-slate-50">
            <h3 className="font-semibold">Execution Results</h3>
            <p className="mt-1 text-xs text-slate-500">
              Individual test case execution results.
            </p>
          </div>

          {testRun.executions.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500">
              No execution results recorded for this test run yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Test Case</th>
                    <th className="px-5 py-3 font-medium">Result</th>
                    <th className="px-5 py-3 font-medium">Executed At</th>
                    <th className="px-5 py-3 font-medium">Executed By</th>
                    <th className="px-5 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {testRun.executions.map((execution) => (
                    <tr key={execution.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {execution.testCase?.testCaseId || execution.testCaseId}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {execution.testCase?.title || ""}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${execution.status === "Passed" ? "bg-emerald-50 text-emerald-700" : execution.status === "Failed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                          {execution.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {execution.executedAt ? (
                          <span>{new Date(execution.executedAt).toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {execution.executedBy?.name || execution.executedBy?.email || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {execution.notes || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          TestForge · QA Management Platform
        </p>
      </section>
    </main>
  );
}
