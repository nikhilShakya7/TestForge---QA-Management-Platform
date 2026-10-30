"use client";

import { useEffect, useState } from "react";

type TestCase = {
  id: string;
  testCaseId: string;
  title: string;
  description: string | null;
  preconditions: string | null;
  steps: string;
  expectedResult: string;
  priority: string;
  status: string;
  suiteId: string | null;
  suite: { id: string; name: string } | null;
  projectId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  executions: Array<{
    id: string;
    status: string;
    executedAt: string;
    notes: string | null;
    executedBy: { id: string; name: string | null; email: string } | null;
  }>;
};

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    Passed: "bg-emerald-50 text-emerald-700",
    Failed: "bg-red-50 text-red-700",
    Blocked: "bg-amber-50 text-amber-700",
    Active: "bg-blue-50 text-blue-700",
    Draft: "bg-slate-50 text-slate-700",
    Archived: "bg-slate-100 text-slate-500",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[status] ?? variants.Draft}`}>
      {status}
    </span>
  );
}

export default function TestCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testCaseId, setTestCaseId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setTestCaseId(p.id));
  }, [params]);

  useEffect(() => {
    params.then(p => setTestCaseId(p.id));
  }, [params]);

  useEffect(() => {
    if (!testCaseId) return;

    async function fetchTestCase() {
      try {
        const res = await fetch(`/api/test-cases/${testCaseId}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load test case");
        const data: TestCase = await res.json();
        setTestCase(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load test case");
      } finally {
        setLoading(false);
      }
    }

    void fetchTestCase();
  }, [testCaseId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
        <section className="min-w-0 flex-1 p-5 md:p-8">
          <h2 className="text-2xl font-bold">Test Case</h2>
          <div className="mt-8 px-5 py-8 text-center text-slate-500">
            Loading test case…
          </div>
        </section>
      </main>
    );
  }

  if (!testCase) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
        <section className="min-w-0 flex-1 p-5 md:p-8">
          <h2 className="text-2xl font-bold">Test Case</h2>
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button
              onClick={() => (window.location.href = "/test-cases")}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Back to Test Cases
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
            <h1 className="text-2xl font-bold">{testCase.testCaseId}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {testCase.title}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                window.location.href = `/test-cases?${window.location.search}`;
              }}
              className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
            >
              Back to List
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("id", testCase.id);
                window.location.href = `/test-cases/edit?id=${testCase.id}`;
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Edit
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Test Case ID</p>
            <p className="mt-1 text-sm font-bold">{testCase.testCaseId}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Title</p>
            <p className="mt-1 text-sm font-medium">{testCase.title}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Priority</p>
            <p className="mt-1 text-sm font-medium">
              <span className={`rounded-full px-2 py-1 text-xs ${testCase.priority === "Critical" ? "bg-red-100 text-red-800" : testCase.priority === "High" ? "bg-orange-100 text-orange-800" : testCase.priority === "Low" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                {testCase.priority}
              </span>
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-1 text-sm font-medium">
              <span className={`rounded-full px-2 py-1 text-xs ${testCase.status === "Active" ? "bg-blue-50 text-blue-700" : testCase.status === "Draft" ? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-500"}`}>
                {testCase.status}
              </span>
            </p>
          </article>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Description</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {testCase.description || "No description provided"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Preconditions</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {testCase.preconditions || "None specified"}
            </p>
          </article>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Steps</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {testCase.steps}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Expected Result</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {testCase.expectedResult}
            </p>
          </article>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3 bg-slate-50">
            <h3 className="font-semibold">Execution History</h3>
            <p className="mt-1 text-xs text-slate-500">
              Execution results for this test case.
            </p>
          </div>

            {testCase.executions.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-500">
                No execution results recorded for this test case yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Result</th>
                      <th className="px-5 py-3 font-medium">Executed At</th>
                      <th className="px-5 py-3 font-medium">Executed By</th>
                      <th className="px-5 py-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {testCase.executions.map((execution) => (
                      <tr key={execution.id} className="border-t border-slate-100">
                        <td className="px-5 py-4">
                          <StatusBadge status={execution.status} />
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
