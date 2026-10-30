"use client";

import { useEffect, useRef, useState } from "react";
import { CircleDashed } from "lucide-react";
import TestRunCard, {
  TestRunCardSkeleton,
} from "@/components/cards/test-run-card";
import TestResultCard from "@/components/cards/test-result-card";

type TestRun = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  suiteId: string | null;
  projectId: string | null;
  suite: {
    id: string;
    name: string;
    _count?: { testCases: number };
  } | null;
  project?: { _count?: { testCases: number } } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string | null;
  _count: {
    executions: number;
    executions_by_status: { passed: number; failed: number; blocked: number };
  };
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
  expectedResult: string | null;
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

export default function TestRunsPage() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [runDetailsLoading, setRunDetailsLoading] = useState(false);
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
  const [selectedExecutionTestCaseId, setSelectedExecutionTestCaseId] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const runDetailsRequest = useRef(0);

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

  useEffect(() => {
    fetchTestRuns();
    fetchTestSuites();
  }, [projectId]);

  async function fetchRunDetails(run: TestRun) {
    const requestId = ++runDetailsRequest.current;
    setRunDetailsLoading(true);
    setError(null);
    try {
      let res = await fetch(
        `/api/test-cases${run.projectId ? `?projectId=${run.projectId}` : ""}${run.suiteId ? `&suiteId=${run.suiteId}` : ""}`,
        { credentials: "include", cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to load test cases");
      if (requestId !== runDetailsRequest.current) return;
      const data: { data: TestCaseForRun[] } = await res.json();
      const cases: TestCaseForRun[] = data.data.map((tc) => ({
        id: tc.id,
        testCaseId: tc.testCaseId,
        title: tc.title,
        expectedResult: tc.expectedResult,
        priority: tc.priority,
        status: tc.status,
      }));
      setRunTestCases(cases);

      res = await fetch(`/api/test-runs/${run.id}/executions`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load executions");
      if (requestId !== runDetailsRequest.current) return;
      const existingExecutions: ExecutionRecord[] = await res.json();

      const initialExecutions: Record<string, ExecutionStatus> = {};
      const initialNotes: Record<string, string> = {};
      const initialActualResults: Record<string, string> = {};
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
      setExecutionActualResults(initialActualResults);
      setExecutionRecords(initialRecords);
      setHasUnsavedChanges(false);
    } catch (err) {
      if (requestId === runDetailsRequest.current) {
        setError(err instanceof Error ? err.message : "Failed to load run details");
      }
    } finally {
      if (requestId === runDetailsRequest.current) {
        setRunDetailsLoading(false);
      }
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
      await fetchRunDetails(newRun);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create test run");
    }
  };

  const handleSelectRun = (run: TestRun) => {
    setSelectedRun(run);
    setRunTestCases([]);
    setExecutions({});
    setExecutionNotes({});
    setExecutionActualResults({});
    setExecutionRecords({});
    setHasUnsavedChanges(false);
    void fetchRunDetails(run);
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

  const handleSetExecution = (
    testCaseId: string,
    status: ExecutionStatus
  ) => {
    if (!selectedRun) return;

    if (executions[testCaseId] === status) return;
    setExecutions((prev) => ({ ...prev, [testCaseId]: status }));
    setHasUnsavedChanges(true);
  };

  const handleSetNote = (testCaseId: string, value: string) => {
    setExecutionNotes((prev) => ({ ...prev, [testCaseId]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSetActualResult = (testCaseId: string, value: string) => {
    setExecutionActualResults((prev) => ({ ...prev, [testCaseId]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveExecutions = async (): Promise<boolean> => {
    if (!selectedRun) return false;
    setSavingExecutions(true);

    try {
      const savedExecutions = await Promise.allSettled(
        runTestCases.flatMap((testCase) => {
          const status = executions[testCase.id];
          if (!status) return [];
          const record = executionRecords[testCase.id];
          const actualResult = executionActualResults[testCase.id] || null;
          const notes = executionNotes[testCase.id] || null;
          if (
            record &&
            record.status === status &&
            record.actualResult === actualResult &&
            record.notes === notes
          ) {
            return [];
          }
          const endpoint = record
            ? `/api/test-runs/${selectedRun.id}/executions/${record.id}`
            : `/api/test-runs/${selectedRun.id}/executions`;
          const requestBody = {
            ...(record ? {} : { testCaseId: testCase.id }),
            status,
            actualResult,
            notes,
          };

          return [
            (async () => {
              const executionResponse = await fetch(endpoint, {
                method: record ? "PATCH" : "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
              });
          if (!executionResponse.ok) {
            const body = await executionResponse.json();
            throw new Error(body.error || "Failed to save execution result");
          }
              return [
                testCase.id,
                (await executionResponse.json()) as ExecutionRecord,
              ] as const;
            })(),
          ];
        })
      );
      const updatedExecutions = savedExecutions.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : []
      );
      if (updatedExecutions.length > 0) {
        setExecutionRecords((prev) => ({
          ...prev,
          ...Object.fromEntries(updatedExecutions),
        }));
      }
      const failedSave = savedExecutions.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected"
      );
      if (failedSave) throw failedSave.reason;

      const res = await fetch(`/api/test-runs/${selectedRun.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "InProgress" }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to update test run status");
      }

      const statusCounts = runTestCases.reduce(
        (counts, testCase) => {
          const status = executions[testCase.id];
          if (status === "Passed") counts.passed += 1;
          if (status === "Failed") counts.failed += 1;
          if (status === "Blocked") counts.blocked += 1;
          return counts;
        },
        { passed: 0, failed: 0, blocked: 0 }
      );
      setTestRuns((prev) =>
        prev.map((r) =>
          r.id === selectedRun.id
            ? {
                ...r,
                status: "InProgress",
                _count: {
                  ...r._count,
                  executions: Object.keys(executions).length,
                  executions_by_status: statusCounts,
                },
              }
            : r
        )
      );
      setSelectedRun((run) =>
        run?.id === selectedRun.id
          ? {
              ...run,
              status: "InProgress",
              _count: {
                ...run._count,
                executions: Object.keys(executions).length,
                executions_by_status: statusCounts,
              },
            }
          : run
      );
      setHasUnsavedChanges(false);

      const executedCount = runTestCases.filter(
        (testCase) => executions[testCase.id]
      ).length;
      alert(
        `Execution results saved for ${executedCount} test case(s) in run "${selectedRun.name}".\n\nRun status updated to InProgress.`
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save executions");
      return false;
    } finally {
      setSavingExecutions(false);
    }
  };

  const openExecutionHistory = async (testCaseId: string) => {
    const execution = executionRecords[testCaseId];
    if (!selectedRun || !execution) return;

    setSelectedExecutionTestCaseId(testCaseId);
    setExecutionHistory([]);
    setLoadingHistory(true);

    try {
      const res = await fetch(
        `/api/test-runs/${selectedRun.id}/executions/${execution.id}/history`,
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

  const handleCompleteRun = async () => {
    if (!selectedRun) return;
    if (hasUnsavedChanges && !(await handleSaveExecutions())) return;
    setSavingExecutions(true);
    setError(null);
    try {
      const res = await fetch(`/api/test-runs/${selectedRun.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" }),
      });
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error || "Failed to complete test run");
      }

      setTestRuns((prev) =>
        prev.map((run) =>
          run.id === selectedRun.id ? { ...run, status: "Completed" } : run
        )
      );
      setSelectedRun((run) =>
        run?.id === selectedRun.id ? { ...run, status: "Completed" } : run
      );
      setTestRuns((runs) =>
        runs.map((run) =>
          run.id === selectedRun.id ? { ...run, status: "Completed" } : run
        )
      );
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete test run");
    } finally {
      setSavingExecutions(false);
    }
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
                runDetailsRequest.current += 1;
                setProjectId(val || null);
                setSelectedRun(null);
                setRunDetailsLoading(false);
                setRunTestCases([]);
                setExecutions({});
                setExecutionNotes({});
                setExecutionActualResults({});
                setExecutionRecords({});
                setHasUnsavedChanges(false);
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
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Test Runs
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {loading
                    ? "Loading test runs..."
                    : `${testRuns.length} test runs displayed`}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <TestRunCardSkeleton key={index} />
                ))}
              </div>
            ) : testRuns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <CircleDashed size={22} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  No test runs found
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  Create a test run to start tracking execution results for this project.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {testRuns.map((run) => (
                  <TestRunCard
                    key={run.id}
                    run={run}
                    deleting={deletingRunId === run.id}
                    onView={() => handleSelectRun(run)}
                    onDelete={() => void handleDeleteRun(run.id, run.name)}
                  />
                ))}
              </div>
            )}
          </section>
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

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {runTestCases.map((testCase) => (
                  <TestResultCard
                    key={testCase.id}
                    testCaseId={testCase.testCaseId}
                    title={testCase.title}
                    status={executions[testCase.id] || "Not Run"}
                    expectedResult={testCase.expectedResult}
                    actualResult={executionActualResults[testCase.id]}
                    notes={executionNotes[testCase.id]}
                    executedAt={executionRecords[testCase.id]?.executedAt}
                    executedBy={
                      executionRecords[testCase.id]?.executedBy?.name ||
                      executionRecords[testCase.id]?.executedBy?.email
                    }
                    editable
                    onStatusChange={(status) =>
                      handleSetExecution(testCase.id, status)
                    }
                    onActualResultChange={(value) =>
                      handleSetActualResult(testCase.id, value)
                    }
                    onNotesChange={(value) => handleSetNote(testCase.id, value)}
                    onUpdate={() => void handleSaveExecutions()}
                    onViewHistory={
                      executionRecords[testCase.id]
                        ? () => void openExecutionHistory(testCase.id)
                        : undefined
                    }
                  />
                ))}
              </div>

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
                  onClick={handleCompleteRun}
                  disabled={savingExecutions || selectedRun.status === "Completed"}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    savingExecutions || selectedRun.status === "Completed"
                      ? "bg-slate-400 text-slate-200"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                >
                  {savingExecutions ? "Saving…" : "Complete Test Run"}
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

        {selectedExecutionTestCaseId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="execution-history-title"
              className="w-full max-w-2xl rounded-xl bg-white shadow-xl"
            >
              <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 id="execution-history-title" className="font-semibold">
                  Execution History
                </h3>
                <button
                  type="button"
                  onClick={closeExecutionHistory}
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </header>
              {loadingHistory ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">
                  Loading history…
                </p>
              ) : executionHistory.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">
                  No previous changes recorded.
                </p>
              ) : (
                <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
                  {executionHistory.map((item) => (
                    <li key={item.id} className="space-y-1 px-5 py-4 text-sm">
                      <p className="font-medium">{item.status}</p>
                      <p className="text-slate-600">
                        {item.changedBy?.name || item.changedBy?.email || "Unknown user"}
                        {" · "}
                        {new Date(item.changedAt).toLocaleString()}
                      </p>
                      {item.actualResult && (
                        <p className="text-slate-600">
                          Actual result: {item.actualResult}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-slate-600">Notes: {item.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {selectedRun && runDetailsLoading && runTestCases.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            Loading run results…
          </div>
        )}

        {selectedRun &&
          !runDetailsLoading &&
          !error &&
          runTestCases.length === 0 && (
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
