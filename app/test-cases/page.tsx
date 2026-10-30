"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
};

type Project = {
  id: string;
  name: string;
  key: string;
};

type ApiResponse = {
  data: TestCase[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};type PriorityBadgeProps = { priority: string };
function PriorityBadge({ priority }: PriorityBadgeProps) {
  const variants: Record<string, string> = {
    Critical: "bg-red-50 text-red-700",
    High: "bg-orange-50 text-orange-700",
    Medium: "bg-slate-50 text-slate-700",
    Low: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[priority] ?? variants["Medium"]}`}>
      {priority}
    </span>
  );
}

type StatusBadgeProps = { status: string };
function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<string, string> = {
    Passed: "bg-emerald-50 text-emerald-700",
    Failed: "bg-red-50 text-red-700",
    Blocked: "bg-amber-50 text-amber-700",
    Active: "bg-blue-50 text-blue-700",
    Draft: "bg-slate-50 text-slate-700",
    Archived: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[status] ?? variants["Draft"]}`}>
      {status}
    </span>
  );
}

export default function TestCasesPage() {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);

  // Project selection
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Test suites for the selected project
  const [testSuites, setTestSuites] = useState<{ id: string; name: string }[]>([]);
  const fetchRequestId = useRef(0);

  // Filters
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Create form state
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    testCaseId: string;
    title: string;
    description: string;
    preconditions: string;
    steps: string;
    expectedResult: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    status: "Draft" | "Active" | "Archived";
    suiteId: string;
  }>({
    testCaseId: "",
    title: "",
    description: "",
    preconditions: "",
    steps: "",
    expectedResult: "",
    priority: "Medium",
    status: "Draft",
    suiteId: "",
  });

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    testCaseId: string;
    title: string;
    description: string;
    preconditions: string;
    steps: string;
    expectedResult: string;
    priority: string;
    status: string;
    suiteId: string | null;
    projectId: string | null;
  } | null>(null);
  const [editingSubmitting, setEditingSubmitting] = useState(false);

  // Fetch available projects for the dropdown
  const fetchProjects = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Fetch test suites for the selected project
  const fetchTestSuites = useCallback(async () => {
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
      const json = await res.json();
      setTestSuites(Array.isArray(json) ? json : json.data || []);
    } catch (err) {
      console.error("Failed to load test suites:", err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTestSuites();
  }, [projectId]);

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

  const fetchTestCases = useCallback(async () => {
    const requestId = ++fetchRequestId.current;
    if (!projectId) {
      setTestCases([]);
      setMeta(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterPriority) params.set("priority", filterPriority);
      if (filterStatus) params.set("status", filterStatus);
      params.set("projectId", projectId);
      params.set("page", "1");
      params.set("pageSize", "50");

      const res = await fetch(`/api/test-cases?${params.toString()}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load test cases");
      }

      const json: ApiResponse = await res.json();
      if (requestId !== fetchRequestId.current) return;
      setError(null);
      setTestCases(json.data);
      setMeta(json.meta);
    } catch (err) {
      if (requestId !== fetchRequestId.current) return;
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      if (requestId === fetchRequestId.current) {
        setLoading(false);
      }
    }
  }, [search, filterPriority, filterStatus, projectId]);

  useEffect(() => {
    fetchTestCases();
  }, [fetchTestCases]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!projectId) {
      setFormError("Please select a project first");
      return;
    }

    try {
      const res = await fetch("/api/test-cases", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          suiteId: formData.suiteId || null,
          projectId,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setFormError(errorBody.error || "Failed to create test case");
        return;
      }

      const newCase = await res.json();
      const matchesSearch =
        !search ||
        [newCase.testCaseId, newCase.title, newCase.description]
          .filter((value): value is string => Boolean(value))
          .some((value) =>
            value.toLocaleLowerCase().includes(search.toLocaleLowerCase())
          );
      const matchesFilters =
        matchesSearch &&
        (!filterPriority || newCase.priority === filterPriority) &&
        (!filterStatus || newCase.status === filterStatus);

      if (matchesFilters) {
        setTestCases((prev) => [newCase, ...prev].slice(0, 50));
        setMeta((prev) =>
          prev
            ? {
                ...prev,
                total: prev.total + 1,
                totalPages: Math.ceil((prev.total + 1) / prev.pageSize),
              }
            : prev
        );
      }
      setCreating(false);
      setFormData({
        testCaseId: "",
        title: "",
        description: "",
        preconditions: "",
        steps: "",
        expectedResult: "",
        priority: "Medium",
        status: "Draft",
        suiteId: "",
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create test case"
      );
    }
  };

  const handleDelete = async (id: string, testCaseId: string) => {
    if (!window.confirm(`Delete test case ${testCaseId}?`)) return;

    try {
      const res = await fetch(`/api/test-cases/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setError(errorBody.error || "Failed to delete test case");
        return;
      }

      setTestCases((prev) => prev.filter((tc) => tc.id !== id));
      setMeta((prev) => {
        if (!prev) return prev;
        const total = Math.max(0, prev.total - 1);
        return {
          ...prev,
          total,
          totalPages: Math.ceil(total / prev.pageSize),
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete test case"
      );
    }
  };

  const openEdit = (testCase: TestCase) => {
    setEditFormData({
      testCaseId: testCase.testCaseId,
      title: testCase.title,
      description: testCase.description ?? "",
      preconditions: testCase.preconditions ?? "",
      steps: testCase.steps,
      expectedResult: testCase.expectedResult,
      priority: testCase.priority,
      status: testCase.status,
      suiteId: testCase.suiteId ?? "",
      projectId: testCase.projectId ?? null,
    });
    setEditingId(testCase.id);
    setEditError(null);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditingSubmitting(true);

    if (!editingId) return;

    try {
      const res = await fetch(`/api/test-cases/${editingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editFormData?.title,
          description: editFormData?.description || undefined,
          preconditions: editFormData?.preconditions || undefined,
          steps: editFormData?.steps,
          expectedResult: editFormData?.expectedResult,
          priority: editFormData?.priority,
          status: editFormData?.status,
          suiteId: editFormData?.suiteId || undefined,
          projectId: editFormData?.projectId || undefined,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setEditError(errorBody.error || "Failed to update test case");
        setEditingSubmitting(false);
        return;
      }

      const updated = await res.json();
      setTestCases((prev) =>
        prev.map((tc) => (tc.id === editingId ? updated : tc))
      );
      setEditingId(null);
      setEditFormData(null);
      setEditError(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update test case"
      );
    } finally {
      setEditingSubmitting(false);
    }
  };

  const priorities = ["Low", "Medium", "High", "Critical"];
  const statuses = ["Draft", "Active", "Archived"];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Test Cases</h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage your test cases.
            </p>
          </div>

          <button
            disabled={!projectId}
            onClick={() => setCreating(!creating)}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Cancel" : "+ New Test Case"}
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
                fetchRequestId.current += 1;
                setTestCases([]);
                setMeta(null);
                setError(null);
                setLoading(Boolean(val));
                setCreating(false);
                setFormError(null);
                setFormData((previous) => ({ ...previous, suiteId: "" }));
                setEditingId(null);
                setEditFormData(null);
                setProjectId(val || null);
                if (val) localStorage.setItem("testforge_projectId", val);
                else localStorage.removeItem("testforge_projectId");
                // Update URL without reload
                const params = new URLSearchParams(window.location.search);
                if (val) params.set("projectId", val);
                else params.delete("projectId");
                const query = params.toString();
                window.history.replaceState(
                  {},
                  "",
                  query
                    ? `${window.location.pathname}?${query}`
                    : window.location.pathname
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
              Viewing test cases for selected project. Create new test cases
              will be assigned to this project.
            </p>
          )}
        </div>

        {!projectId && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              Please select a project to view and manage test cases.
            </p>
          </div>
        )}

        {/* Search & Filters */}
        {projectId && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by ID, title or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="">All priorities</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Create form */}
        {creating && projectId && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Create Test Case</h3>
            {formError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Test Case ID (e.g. TC-001)
                </label>
                <input
                  name="testCaseId"
                  value={formData.testCaseId}
                  onChange={(e) =>
                    setFormData({ ...formData, testCaseId: e.target.value })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Test Suite
                </label>
                <select
                  name="suiteId"
                  value={formData.suiteId}
                  onChange={(e) =>
                    setFormData({ ...formData, suiteId: e.target.value })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="">No suite (standalone)</option>
                  {testSuites.map((suite) => (
                    <option key={suite.id} value={suite.id}>
                      {suite.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Title
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Description
                </label>
                <input
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Preconditions
                </label>
                <input
                  name="preconditions"
                  value={formData.preconditions}
                  onChange={(e) =>
                    setFormData({ ...formData, preconditions: e.target.value })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Steps
                </label>
                <textarea
                  name="steps"
                  value={formData.steps}
                  onChange={(e) =>
                    setFormData({ ...formData, steps: e.target.value })
                  }
                  rows={3}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Expected Result
                </label>
                <textarea
                  name="expectedResult"
                  value={formData.expectedResult}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedResult: e.target.value })
                  }
                  rows={3}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as "Low" | "Medium" | "High" | "Critical" })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "Draft" | "Active" | "Archived" })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Create Test Case
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit form */}
        {editingId && editFormData && projectId && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Edit Test Case</h3>
            {editError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {editError}
              </div>
            )}
            <form onSubmit={handleEditSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Test Case ID (e.g. TC-001)
                </label>
                <input
                  name="testCaseId"
                  value={editFormData.testCaseId}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, testCaseId: e.target.value } : prev
                    )
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Test Suite
                </label>
                <select
                  name="suiteId"
                  value={editFormData.suiteId ?? ""}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, suiteId: e.target.value } : prev
                    )
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="">No suite (standalone)</option>
                  {testSuites.map((suite) => (
                    <option key={suite.id} value={suite.id}>
                      {suite.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Title
                </label>
                <input
                  name="title"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev
                    )
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Description
                </label>
                <input
                  name="description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev
                    )
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Preconditions
                </label>
                <input
                  name="preconditions"
                  value={editFormData.preconditions}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, preconditions: e.target.value } : prev
                    )
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Steps
                </label>
                <textarea
                  name="steps"
                  value={editFormData.steps}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, steps: e.target.value } : prev
                    )
                  }
                  rows={3}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Expected Result
                </label>
                <textarea
                  name="expectedResult"
                  value={editFormData.expectedResult}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, expectedResult: e.target.value } : prev
                    )
                  }
                  rows={3}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={editFormData.priority}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev
                        ? {
                            ...prev,
                            priority: e.target.value as
                              | "Low"
                              | "Medium"
                              | "High"
                              | "Critical",
                          }
                        : prev
                    )
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev
                        ? {
                            ...prev,
                            status: e.target.value as
                              | "Draft"
                              | "Active"
                              | "Archived",
                          }
                        : prev
                    )
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={editingSubmitting}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    editingSubmitting
                      ? "bg-slate-400 text-slate-200"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {editingSubmitting ? "Updating…" : "Update Test Case"}
                </button>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditFormData(null);
                    setEditError(null);
                  }}
                  className="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Test cases table */}
        {projectId && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Suite</th>
                  <th className="px-5 py-3 font-medium">Priority</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-4 text-slate-500">
                      Loading test cases…
                    </td>
                  </tr>
                ) : testCases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No test cases found.
                    </td>
                  </tr>
                ) : (
                  testCases.map((tc) => (
                    <tr
                      key={tc.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => {
                        window.location.href = `/test-cases/${tc.id}`;
                      }}
                      >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {tc.testCaseId}
                      </td>
                      <td className="px-5 py-4">{tc.title}</td>
                      <td className="px-5 py-4">
                        {tc.suite ? (
                          <span className="text-xs text-slate-500">
                            {tc.suite.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <PriorityBadge priority={tc.priority} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={tc.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(tc);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(tc.id, tc.testCaseId)
                            }}
                            className="text-xs text-red-600 hover:text-red-700 underline underline-offset-4"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {meta && projectId && (
          <p className="mt-4 text-xs text-slate-400">
            Showing {testCases.length} of {meta.total} test cases
          </p>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          TestForge · QA Management Platform
        </p>
      </section>
    </main>
  );
}
