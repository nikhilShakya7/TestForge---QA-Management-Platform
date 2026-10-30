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
  _count: { executions: number };
};

type Project = {
  id: string;
  name: string;
  key: string;
};

type TestSuite = {
  id: string;
  name: string;
  description: string | null;
  projectId: string | null;
};

type TestCaseForRun = {
  id: string;
  testCaseId: string;
  title: string;
  expectedResult: string;
  priority: string;
  status: string;
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
};

type ExecutionHistoryRecord = {
  id: string;
  status: string;
  actualResult: string | null;
  notes: string | null;
  changedAt: string;
  changedBy: { id: string; name: string | null; email: string } | null;
};

const STATUS_VARIANTS: Record<ExecutionStatus, string> = {
  Passed: "bg-emerald-50 text-emerald-700",
  Failed: "bg-red-50 text-red-700",
  Blocked: "bg-amber-50 text-amber-700",
};

export default function TestRunsPage() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

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
  const [executionActualResults, setExecutionActualResults] = useState<Record<string, string>>({});
  const [executionRecords, setExecutionRecords] = useState<Record<string, ExecutionRecord>>({});
  const [savingExecutions, setSavingExecutions] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Execution history modal state
  const [showExecutionHistory, setShowExecutionHistory] = useState(false);
  const [selectedExecutionTestCaseId, setSelectedExecutionTestCaseId] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch available projects for the dropdown
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

  async function fetchTestRuns() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);

      const res = await fetch(`/api/test-runs?${params.toString()}`, {
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
    if (!projectId) {
      setTestSuites([]);
      return;
    }
    try {
      const res = await fetch(`/api/test-suites?projectId=${projectId}`, {
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

  // Re-fetch test runs and suites when project changes
  useEffect(() => {
    fetchTestRuns();
    fetchTestSuites();
  }, [projectId]);

  async function fetchRunDetails(runId: string) {
    const run = testRuns.find((r) => r.id === runId);
    if (!run) return;

    try {
      let res = await fetch(
        `/api/test-cases${run.projectId ? `?projectId=${run.projectId}` : ""}${run.suiteId ? `&suiteId=${run.suiteId}` : ""}`,
        { credentials: "include", cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to load test cases");
      const data: any = await res.json();
      const cases: TestCaseForRun[] = data.data.map((tc: any) => ({
        id: tc.id,
        testCaseId: tc.testCaseId,
        title: tc.title,
        expectedResult: tc.expectedResult,
        priority: tc.priority,
        status: tc.status,
      }));
      setRunTestCases(cases);

      res = await fetch(`/api/test-runs/${runId}/executions`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load executions");
      const existingExecutions: ExecutionRecord[] = await res.json();

      const initialExecutions: Record<string, ExecutionStatus> = {};
      const initialNotes: Record<string, string> = {};
      const initialActualResults: Record<string, string | null> = {};
      const initialRecords: Record<string, ExecutionRecord> = {};

      cases.forEach((tc) => {
        initialNotes[tc.id] = "";
        initialActualResults[tc.id] = "";
      });

      existingExecutions.forEach((ex) => {
        initialExecutions[ex.testCaseId] = ex.status;
        initialNotes[ex.testCaseId] = ex.notes || "";
        initialActualResults[ex.testCaseId] = ex.actualResult || "";
        initialRecords[ex.testCaseId] = ex;
      });

      setExecutions(initialExecutions);
      setExecutionNotes(initialNotes);
      setExecutionRecords(initialRecords);
    } catch (err) {
      console.error("Failed to load run details:", err);
    }
  }

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!projectId) {
      setCreateError("Please select a project first");
      return;
    }

    try {
      const res = await fetch("/api/test-runs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description || undefined,
          suiteId: createForm.suiteId || undefined,
          projectId,
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

  const handleDeleteRun = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Delete test run "${name}" and all its execution results and history? This cannot be undone.`
      )
    ) return;

    setDeletingRunId(id);

    try {
      const res = await fetch(`/api/test-runs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setError(errorBody.error || "Failed to delete test run");
        setDeletingRunId(null);
        return;
      }

      setTestRuns((prev) => prev.filter((r) => r.id !== id));
      if (selectedRun?.id === id) {
        setSelectedRun(null);
        setRunTestCases([]);
        setExecutions({});
        setExecutionNotes({});
        setExecutionActualResults({});
        setExecutionRecords({});
      }
      setDeletingRunId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete test run");
      setDeletingRunId(null);
    }
  };

  const handleSetExecution = async (
    testCaseId: string,
    status: ExecutionStatus
  ) => {
    if (!selectedRun) return;

    if (executions[testCaseId] === status) return;

    setExecutions((prev) => ({ ...prev, [testCaseId]: status }));
    setHasUnsavedChanges(true);

    try {
      if (executionRecords[testCaseId]) {
        // Update existing execution via PATCH
        const res = await fetch(
          `/api/test-runs/${selectedRun.id}/executions/${executionRecords[testCaseId].id}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status,
              actualResult: executionActualResults[testCaseId] || null,
              notes: executionNotes[testCaseId] || null,
            }),
          }
        );

        if (!res.ok) {
          const errorBody = await res.json();
          throw new Error(errorBody.error || "Failed to update execution");
        }

        const updated = await res.json();
        setExecutionRecords((prev) => ({
          ...prev,
          [testCaseId]: updated,
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
          actualResult: executionActualResults[testCaseId] || null,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
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
      setExecutions((prev) => ({ ...prev, [testCaseId]: "Passed" }));
    }
  };

  const handleSetNote = (testCaseId: string, value: string) => {
    setExecutionNotes((prev) => ({ ...prev, [testCaseId]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSetActualResult = (testCaseId: string, value: string) => {
    setExecutionActualResults((prev) => ({ ...prev, [testCaseId]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveExecutions = async () => {
    if (!selectedRun) return;
    setSavingExecutions(true);

    try {
      // Save all pending test case executions via PATCH
      const savePromises = Object.entries(executionRecords).map(
        async ([testCaseId, execution]) => {
          const currentStatus = executions[testCaseId];
          const currentNotes = executionNotes[testCaseId] || null;
          const currentActualResult =
            executionActualResults[testCaseId] || null;

          // Only save if there's an actual change from server record
          if (
            execution.status === currentStatus &&
            execution.notes === (currentNotes || "") &&
            execution.actualResult === (currentActualResult || null)
          ) {
            return;
          }

          return fetch(`/api/test-runs/${selectedRun.id}/executions/${execution.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: currentStatus,
              actualResult: currentActualResult,
              notes: currentNotes,
            }),
          });
        }
      );

      const results = await Promise.all(savePromises);

      const failedSaves = results.filter((r) => r && !r.ok);
      if (failedSaves.length > 0) {
        throw new Error(`Failed to save ${failedSaves.length} execution(s)`);
      }

      // Update run status to InProgress
      const res = await fetch(`/api/test-runs/${selectedRun.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "InProgress" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update test run status");
      }

      setTestRuns((prev) =>
        prev.map((r) =>
          r.id === selectedRun!.id ? { ...r, status: "InProgress" } : r
        )
      );

      const executedCount = executionRecords.length;
      alert(
        `Execution results saved for ${executedCount} test case(s) in run "${selectedRun.name}".\n\nRun status updated to InProgress.`
      );
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save executions");
    } finally {
      setSavingExecutions(false);
    }
  };

  const handleCompleteRun = async () => {
    if (!selectedRun) return;

    // First save all pending executions
    const savePromises = Object.entries(executionRecords).map(
      ([testCaseId, execution]) => {
        const currentStatus = executions[testCaseId];
        const currentNotes = executionNotes[testCaseId] || null;
        const currentActualResult =
          executionActualResults[testCaseId] || null;

        if (
          execution.status === currentStatus &&
          execution.notes === (currentNotes || "") &&
          execution.actualResult === (currentActualResult || null)
        ) {
          return;
        }

        return fetch(`/api/test-runs/${selectedRun.id}/executions/${execution.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: currentStatus,
            actualResult: currentActualResult,
            notes: currentNotes,
          }),
        });
      }
    );

    try {
      const results = await Promise.all(savePromises);
      const failedSaves = results.filter((r) => r && !r.ok);
      if (failedSaves.length > 0) {
        throw new Error(`Failed to save ${failedSaves.length} execution(s)`);
      }

      // Complete the test run
      const res = await fetch(`/api/test-runs/${selectedRun.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" }),
      });

      if (!res.ok) {
        throw new Error("Failed to complete test run");
      }

      setTestRuns((prev) =>
        prev.map((r) =>
          r.id === selectedRun!.id ? { ...r, status: "Completed" } : r
        )
      );

      setSelectedRun((prev) =>
        prev ? { ...prev, status: "Completed" } : null
      );

      setHasUnsavedChanges(false);
      alert(
        `Test run "${selectedRun.name}" completed successfully.\n${Object.keys(executionRecords).length} test case(s) executed.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete test run");
    } finally {
      setSavingExecutions(false);
    }
  };

  const runStats = (run: TestRun) => {
    const total = run._count?.executions ?? 0;
    return { total, passed: 0, failed: 0, blocked: 0 };
  };

  // Execution history functions
  const openExecutionHistory = async (testCaseId: string) => {
    setSelectedExecutionTestCaseId(testCaseId);
    setExecutionHistory([]);
    setLoadingHistory(true);

    try {
      const res = await fetch(
        `/api/test-runs/${selectedRun!.id}/executions/${testCaseId}/history`,
        {
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error("Failed to load execution history");
      const data: ExecutionHistoryRecord[] = await res.json();
      setExecutionHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load execution history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeExecutionHistory = () => {
    setSelectedExecutionTestCaseId(null);
    setExecutionHistory([]);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
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

        {/* Project selector */}
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
            {projectsLoading && (
              <span className="text-xs text-slate-400 italic">Loading…</span>
            )}
          </div>
          {projectId && (
            <p className="text-xs text-slate-500 mt-1">
              Viewing test runs for selected project. Create new test runs
              will be assigned to this project.
            </p>
          )}
        </div>

        {!projectId && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              Please select a project to view and manage test runs.
            </p>
          </div>
        )}

        {/* Create test run form */}
        {creating && projectId && (
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
        {projectId && (
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
              <div className="overflow-x-auto">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          const params = new URLSearchParams(window.location.search);
                          params.set("id", run.id);
                          window.location.href = `/test-runs/[id]/page?id=${run.id}`;
                        }}
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
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectRun(run);
                              }}
                              className="text-sm text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                            >
                              View / Record Results
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteRun(run.id, run.name);
                              }}
                              disabled={deletingRunId === run.id}
                              className="text-xs text-red-600 hover:text-red-700 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingRunId === run.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Test Case ID</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Result</th>
                  <th className="px-5 py-3 font-medium">Expected Result</th>
                  <th className="px-5 py-3 font-medium">Actual Result</th>
                  <th className="px-5 py-3 font-medium">Notes</th>
                  <th className="px-5 py-3 font-medium">History</th>
                </tr>
              </thead>
              <tbody>
                {runTestCases.map((tc) => {
                  return (
                    <tr key={tc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {tc.testCaseId}
                      </td>
                      <td className="px-5 py-4">{tc.title}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {["Passed", "Failed", "Blocked"].map((status) => {
                            const isActive =
                              executions[tc.id] === status;
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
                        <span className="text-sm text-slate-600">
                          {tc.expectedResult || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="text"
                          placeholder="Actual result…"
                          value={executionActualResults[tc.id] || ""}
                          onChange={(e) =>
                            handleSetActualResult(tc.id, e.target.value)
                          }
                          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => openExecutionHistory(tc.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                        >
                          View History
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} className="px-5 py-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        type="button"
                        onClick={handleSaveExecutions}
                        disabled={savingExecutions || !hasUnsavedChanges}
                        className={`w-full sm:w-auto rounded-lg bg-indigo-600 text-white text-sm font-medium px-6 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${savingExecutions || !hasUnsavedChanges ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                      >
                        {savingExecutions ? 'Saving…' : 'Save Execution Results'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteRun}
                        disabled={savingExecutions || !hasUnsavedChanges}
                        className={`w-full sm:w-auto rounded-lg bg-blue-600 text-white text-sm font-medium px-6 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${savingExecutions || !hasUnsavedChanges ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        {savingExecutions ? 'Saving…' : 'Complete Test Run'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRun(null)}
                        className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Back to List
                      </button>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {selectedRun && runTestCases.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">{selectedRun.name}</h3>
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
