"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";

type TestRun = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  suiteId: string | null;
  suite: { id: string; name: string } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
  _count: { executions: number };
};

type TestSuite = {
  id: string;
  name: string;
  description: string | null;
};

type TestCaseForRun = {
  id: string;
  testCaseId: string;
  title: string;
  priority: string;
  status: string;
};

type ExecutionStatus = "Passed" | "Failed" | "Blocked";

type ExecutionRecord = {
  id: string;
  testCaseId: string;
  status: ExecutionStatus;
  notes: string | null;
  executedAt: string;
  executedBy: { id: string; name: string | null; email: string } | null;
};

const STATUS_VARIANTS: Record<ExecutionStatus, string> = {
  Passed: "bg-emerald-50 text-emerald-700",
  Failed: "bg-red-50 text-red-700",
  Blocked: "bg-amber-50 text-amber-700",
};

export default function TestRunsPage() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create run form state
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    suiteId: "" as string,
  });

  // Select a run to view executions
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [runTestCases, setRunTestCases] = useState<TestCaseForRun[]>([]);
  const [executions, setExecutions] = useState<Record<string, ExecutionStatus>>({});
  const [executionNotes, setExecutionNotes] = useState<Record<string, string>>({});
  const [executionRecords, setExecutionRecords] = useState<Record<string, ExecutionRecord>>({});
  const [savingExecutions, setSavingExecutions] = useState(false);

  async function fetchTestRuns() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/test-runs", {
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
  }

  async function fetchTestSuites() {
    try {
      const res = await fetch("/api/test-suites", {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load test suites");
      const data: TestSuite[] = await res.json();
      setTestSuites(data);
    } catch (err) {
      console.error("Failed to load test suites:", err);
    }
  }

  async function fetchRunDetails(runId: string) {
    // Fetch test cases in the suite (or all if no suite)
    const run = testRuns.find((r) => r.id === runId);
    if (!run) return;

    try {
      let res = await fetch(
        `/api/test-cases${run.suiteId ? `?suiteId=${run.suiteId}` : ""}`,
        { credentials: "include", cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to load test cases");
      const data: any = await res.json();
      const cases: TestCaseForRun[] = data.data.map((tc: any) => ({
        id: tc.id,
        testCaseId: tc.testCaseId,
        title: tc.title,
        priority: tc.priority,
        status: tc.status,
      }));
      setRunTestCases(cases);

      // Fetch existing executions for this run
      res = await fetch(`/api/test-runs/${runId}/executions`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load executions");
      const existingExecutions: ExecutionRecord[] = await res.json();

      const initialExecutions: Record<string, ExecutionStatus> = {};
      const initialNotes: Record<string, string> = {};
      const initialRecords: Record<string, ExecutionRecord> = {};

      cases.forEach((tc) => {
        initialExecutions[tc.id] = "Passed";
        initialNotes[tc.id] = "";
      });

      existingExecutions.forEach((ex) => {
        initialExecutions[ex.testCaseId] = ex.status;
        initialNotes[ex.testCaseId] = ex.notes || "";
        initialRecords[ex.testCaseId] = ex;
      });

      setExecutions(initialExecutions);
      setExecutionNotes(initialNotes);
      setExecutionRecords(initialRecords);
    } catch (err) {
      console.error("Failed to load run details:", err);
    }
  }

  useEffect(() => {
    fetchTestRuns();
    fetchTestSuites();
  }, []);

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    try {
      const res = await fetch("/api/test-runs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description || undefined,
          suiteId: createForm.suiteId || undefined,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setCreateError(errorBody.error || "Failed to create test run");
        return;
      }

      const newRun = await res.json();
      setTestRuns((prev) => [newRun, ...prev]);
      setCreating(false);
      setCreateForm({ name: "", description: "", suiteId: "" });
      setSelectedRun(newRun);
      await fetchRunDetails(newRun.id);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create test run");
    }
  };

  const handleSelectRun = (run: TestRun) => {
    setSelectedRun(run);
    setRunTestCases([]);
    setExecutions({});
    void fetchRunDetails(run.id);
  };

  const handleSetExecution = async (
    testCaseId: string,
    status: ExecutionStatus
  ) => {
    if (!selectedRun) return;

    // Don't re-save if status hasn't changed
    if (executions[testCaseId] === status) return;

    // Optimistic local update
    setExecutions((prev) => ({ ...prev, [testCaseId]: status }));

    try {
      // Only create new executions; updating existing ones requires
      // a PATCH /api/test-runs/[runId]/executions/[executionId] endpoint
      // (planned for a future step)
      if (executionRecords[testCaseId]) {
        // Update local state only; server-side update not yet supported
        setExecutionNotes((prev) => ({
          ...prev,
          [testCaseId]: executionNotes[testCaseId] || "",
        }));
        return;
      }

      const res = await fetch(`/api/test-runs/${selectedRun.id}/executions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testCaseId,
          status,
          notes: executionNotes[testCaseId] || null,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        // Rollback optimistic update on duplicate
        if (res.status === 409) {
          setExecutions((prev) => ({
            ...prev,
            [testCaseId]: executionRecords[testCaseId]?.status || "Passed",
          }));
        }
        throw new Error(errorBody.error || "Failed to save execution");
      }

      const created = await res.json();
      setExecutionRecords((prev) => ({
        ...prev,
        [testCaseId]: created,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save execution result");
      // Rollback optimistic update
      setExecutions((prev) => ({ ...prev, [testCaseId]: "Passed" }));
    }
  };

  const handleSetNote = (testCaseId: string, value: string) => {
    setExecutionNotes((prev) => ({ ...prev, [testCaseId]: value }));
  };

  const handleSaveExecutions = async () => {
    if (!selectedRun) return;
    setSavingExecutions(true);

    try {
      // Mark the test run as InProgress since executions are being recorded
      const res = await fetch(`/api/test-runs/${selectedRun.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "InProgress" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update test run status");
      }

      // Update local run status
      setTestRuns((prev) =>
        prev.map((r) =>
          r.id === selectedRun!.id ? { ...r, status: "InProgress" } : r
        )
      );

      const executedCount = Object.keys(executionRecords).length;
      alert(
        `Execution results saved for ${executedCount} test case(s) in run "${selectedRun.name}".\n\nRun status updated to InProgress.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save executions");
    } finally {
      setSavingExecutions(false);
    }
  };

  const runStats = (run: TestRun) => {
    const total = run._count.executions;
    // We don't have per-status counts from the API yet, so return placeholder
    return { total, passed: 0, failed: 0, blocked: 0 };
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <Sidebar />

      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Test Runs</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create and manage test execution runs.
            </p>
          </div>

          <button
            onClick={() => setCreating(!creating)}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            {creating ? "Cancel" : "+ New Test Run"}
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Create test run form */}
        {creating && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Create Test Run</h3>
            {createError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateRun} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Test Run Name
                </label>
                <input
                  name="name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Description
                </label>
                <input
                  name="description"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Test Suite (optional)
                </label>
                <select
                  name="suiteId"
                  value={createForm.suiteId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, suiteId: e.target.value })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="">No suite (standalone run)</option>
                  {testSuites.map((suite) => (
                    <option key={suite.id} value={suite.id}>
                      {suite.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Create Test Run
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Test runs list */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3 bg-slate-50">
            <h3 className="font-semibold">Test Runs</h3>
            <p className="mt-1 text-xs text-slate-500">
              Execution sessions for tracking test results.
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-8 text-center text-slate-500">
              Loading test runs…
            </div>
          ) : testRuns.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500">
              No test runs yet. Create one to get started.
            </div>
          ) : (
            <table className="w-full text-left text-sm divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Suite</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Executions</th>
                  <th className="px-5 py-3 font-medium">Created By</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testRuns.map((run) => {
                  const { total } = runStats(run);
                  const isSelected = selectedRun?.id === run.id;
                  return (
                    <tr
                      key={run.id}
                      onClick={() => handleSelectRun(run)}
                      className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                        isSelected ? "bg-indigo-50" : ""
                      }`}
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {run.name}
                      </td>
                      <td className="px-5 py-4">
                        {run.suite ? (
                          <span className="text-xs text-slate-500">
                            {run.suite.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${run.status === "Completed" ? "bg-emerald-50 text-emerald-700" : run.status === "InProgress" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-700"}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">{total}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {run.createdBy?.name || run.createdBy?.email || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRun(run);
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                        >
                          View / Record Results
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Run detail: record executions */}
        {selectedRun && runTestCases.length > 0 && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">
                  Record Results: {selectedRun.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Mark each test case as Passed, Failed, or Blocked.
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedRun.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {selectedRun.status}
              </span>
            </div>

            <table className="w-full text-left text-sm divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Test Case ID</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Result</th>
                  <th className="px-5 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {runTestCases.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {tc.testCaseId}
                    </td>
                    <td className="px-5 py-4">{tc.title}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {["Passed", "Failed", "Blocked"].map((status) => {
                          const serverStatus =
                            executionRecords[tc.id]?.status;
                          const isActive =
                            serverStatus === status ||
                            (executions[tc.id] === status && !serverStatus);
                          return (
                            <button
                              key={status}
                              onClick={() =>
                                handleSetExecution(
                                  tc.id,
                                  status as ExecutionStatus
                                )
                              }
                              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                isActive
                                  ? "bg-indigo-600 text-white"
                                  : STATUS_VARIANTS[status as ExecutionStatus]
                              }`}
                            >
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <input
                        type="text"
                        placeholder="Execution notes…"
                        value={executionNotes[tc.id] || ""}
                        onChange={(e) =>
                          handleSetNote(tc.id, e.target.value)
                        }
                        className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleSaveExecutions}
                disabled={savingExecutions}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  savingExecutions
                    ? "bg-slate-400 text-slate-200"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {savingExecutions ? "Saving…" : "Save Execution Results"}
              </button>
              <button
                onClick={() => setSelectedRun(null)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Back to List
              </button>
            </div>
          </div>
        )}

        {selectedRun && runTestCases.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">
              {selectedRun.name}
            </h3>
            <p className="text-sm text-slate-500">
              No test cases in this run. Add test cases to a suite first, or
              create a test run with a suite that has test cases.
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          TestForge · QA Management Platform
        </p>
      </section>
    </main>
  );
}
