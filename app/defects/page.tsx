"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type Defect = {
  id: string;
  title: string;
  description: string | null;
  reproSteps: string | null;
  expectedResult: string | null;
  actualResult: string | null;
  severity: string;
  priority: string;
  status: string;
  testCaseId: string | null;
  testCase: { id: string; testCaseId: string; title: string } | null;
  reportedBy: { id: string; name: string | null; email: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
};

type Project = {
  id: string;
  name: string;
  key: string;
};

type DefectResponse = {
  data: Defect[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

type SeverityBadgeProps = { severity: string };
function SeverityBadge({ severity }: SeverityBadgeProps) {
  const variants: Record<string, string> = {
    Critical: "bg-red-50 text-red-700",
    High: "bg-orange-50 text-orange-700",
    Medium: "bg-slate-50 text-slate-700",
    Low: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[severity] ?? variants["Medium"]}`}
    >
      {severity}
    </span>
  );
}

type StatusBadgeProps = { status: string };
function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<string, string> = {
    Open: "bg-blue-50 text-blue-700",
    InProgress: "bg-indigo-50 text-indigo-700",
    Resolved: "bg-emerald-50 text-emerald-700",
    Closed: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[status] ?? variants["Open"]}`}
    >
      {status}
    </span>
  );
}

type PriorityBadgeProps = { priority: string };
function PriorityBadge({ priority }: PriorityBadgeProps) {
  const variants: Record<string, string> = {
    Critical: "bg-red-50 text-red-700",
    High: "bg-orange-50 text-orange-700",
    Medium: "bg-slate-50 text-slate-700",
    Low: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[priority] ?? variants["Medium"]}`}
    >
      {priority}
    </span>
  );
}

export default function DefectsPage() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DefectResponse["meta"] | null>(null);

  // Project selection
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const fetchRequestId = useRef(0);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // Create / Edit form state
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    reproSteps: string;
    expectedResult: string;
    actualResult: string;
    severity: string;
    priority: string;
    status: string;
    testCaseId: string;
    assigneeId: string;
  }>({
    title: "",
    description: "",
    reproSteps: "",
    expectedResult: "",
    actualResult: "",
    severity: "Medium",
    priority: "Medium",
    status: "Open",
    testCaseId: "",
    assigneeId: "",
  });

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects", {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load projects");
      const json: { data: Project[] } = await res.json();
      setProjects(json.data);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load projects"
      );
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const stored = localStorage.getItem("testforge_projectId");
    const params = new URLSearchParams(window.location.search);
    const selectedProjectId = params.get("projectId") || stored;
    if (selectedProjectId) {
      setProjectId(selectedProjectId);
      localStorage.setItem("testforge_projectId", selectedProjectId);
    }
  }, []);

  const fetchDefects = useCallback(async () => {
    const requestId = ++fetchRequestId.current;
    if (!projectId) {
      setDefects([]);
      setMeta(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      if (filterSeverity) params.set("severity", filterSeverity);
      if (filterPriority) params.set("priority", filterPriority);
      params.set("projectId", projectId);
      params.set("page", "1");
      params.set("pageSize", "50");

      const res = await fetch(`/api/defects?${params.toString()}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load defects");
      }

      const json: DefectResponse = await res.json();
      if (requestId !== fetchRequestId.current) return;
      setDefects(json.data);
      setMeta(json.meta);
    } catch (err) {
      if (requestId !== fetchRequestId.current) return;
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      if (requestId === fetchRequestId.current) {
        setLoading(false);
      }
    }
  }, [search, filterStatus, filterSeverity, filterPriority, projectId]);

  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/defects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          reproSteps: formData.reproSteps || undefined,
          expectedResult: formData.expectedResult || undefined,
          actualResult: formData.actualResult || undefined,
          severity: formData.severity,
          priority: formData.priority,
          status: formData.status,
          testCaseId: formData.testCaseId || undefined,
          projectId,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setFormError(errorBody.error || "Failed to create defect");
        setSubmitting(false);
        return;
      }

      const newDefect = await res.json();
      setDefects((prev) => [newDefect, ...prev]);
      setFormMode(null);
      setEditingId(null);
      setFormData({
        title: "",
        description: "",
        reproSteps: "",
        expectedResult: "",
        actualResult: "",
        severity: "Medium",
        priority: "Medium",
        status: "Open",
        testCaseId: "",
        assigneeId: "",
      });
      await fetchDefects();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create defect",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/defects/${editingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          reproSteps: formData.reproSteps || undefined,
          expectedResult: formData.expectedResult || undefined,
          actualResult: formData.actualResult || undefined,
          severity: formData.severity,
          priority: formData.priority,
          status: formData.status,
          testCaseId: formData.testCaseId || undefined,
          assigneeId: formData.assigneeId || undefined,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setFormError(errorBody.error || "Failed to update defect");
        setSubmitting(false);
        return;
      }

      const updated = await res.json();
      setDefects((prev) => prev.map((d) => (d.id === editingId ? updated : d)));
      setFormMode(null);
      setEditingId(null);
      await fetchDefects();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to update defect",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete defect "${title}"?`)) return;

    try {
      const res = await fetch(`/api/defects/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete defect");
      }

      setDefects((prev) => prev.filter((d) => d.id !== id));
      await fetchDefects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete defect");
    }
  };

  const handleInlineUpdate = async (
    id: string,
    field: "severity" | "priority" | "status",
    value: string,
  ) => {
    // Optimistic update: change locally immediately for snappy UX
    const previous = defects;
    setDefects((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );

    try {
      const res = await fetch(`/api/defects/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) {
        // Revert on failure
        setDefects(previous);
        const errorBody = await res.json();
        setError(errorBody.error || `Failed to update ${field}`);
        return;
      }

      const updated = await res.json();
      setDefects((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (err) {
      setDefects(previous); // revert
      setError(
        err instanceof Error ? err.message : `Failed to update ${field}`,
      );
    }
  };

  const openEdit = (defect: Defect) => {
    setFormData({
      title: defect.title,
      description: defect.description ?? "",
      reproSteps: defect.reproSteps ?? "",
      expectedResult: defect.expectedResult ?? "",
      actualResult: defect.actualResult ?? "",
      severity: defect.severity as "Low" | "Medium" | "High" | "Critical",
      priority: defect.priority as "Low" | "Medium" | "High" | "Critical",
      status: defect.status as "Open" | "InProgress" | "Resolved" | "Closed",
      testCaseId: defect.testCaseId ?? "",
      assigneeId: defect.assignee?.id ?? "",
    });
    setEditingId(defect.id);
    setFormMode("edit");
  };

  const statuses = ["Open", "InProgress", "Resolved", "Closed"];
  const severities = ["Low", "Medium", "High", "Critical"];
  const priorities = ["Low", "Medium", "High", "Critical"];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Defects</h2>
            <p className="mt-1 text-sm text-slate-500">
              Report and track defects found during testing.
            </p>
          </div>

          <button
            disabled={!projectId}
            onClick={() => {
              setFormMode("create");
              setEditingId(null);
              setFormData({
                title: "",
                description: "",
                reproSteps: "",
                expectedResult: "",
                actualResult: "",
                severity: "Medium",
                priority: "Medium",
                status: "Open",
                testCaseId: "",
                assigneeId: "",
              });
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {formMode === "create" ? "Cancel" : "+ Report Defect"}
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <label
              htmlFor="defect-project"
              className="text-sm font-medium text-slate-700"
            >
              Project:
            </label>
            <select
              id="defect-project"
              value={projectId ?? ""}
              onChange={(e) => {
                const selectedProjectId = e.target.value;
                fetchRequestId.current += 1;
                setDefects([]);
                setMeta(null);
                setError(null);
                setLoading(Boolean(selectedProjectId));
                setProjectId(selectedProjectId || null);
                if (selectedProjectId) {
                  localStorage.setItem(
                    "testforge_projectId",
                    selectedProjectId
                  );
                } else {
                  localStorage.removeItem("testforge_projectId");
                }
                setFormMode(null);
                setEditingId(null);
                const params = new URLSearchParams(window.location.search);
                if (selectedProjectId) {
                  params.set("projectId", selectedProjectId);
                } else {
                  params.delete("projectId");
                }
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
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.key} - {project.name}
                </option>
              ))}
            </select>
            {projectsLoading && (
              <span className="text-xs italic text-slate-400">Loading…</span>
            )}
          </div>
          {projectId && (
            <p className="mt-1 text-xs text-slate-500">
              Viewing defects for the selected project.
            </p>
          )}
        </div>

        {!projectId && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              Please select a project to view and manage defects.
            </p>
          </div>
        )}

        {/* Create / Edit form */}
        {formMode && projectId && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">
              {formMode === "create" ? "Report New Defect" : "Edit Defect"}
            </h3>
            {formError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {formError}
              </div>
            )}
            <form
              onSubmit={formMode === "create" ? handleCreate : handleUpdate}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
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
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Reproduction Steps
                </label>
                <textarea
                  name="reproSteps"
                  value={formData.reproSteps}
                  onChange={(e) =>
                    setFormData({ ...formData, reproSteps: e.target.value })
                  }
                  rows={3}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
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
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Actual Result
                </label>
                <textarea
                  name="actualResult"
                  value={formData.actualResult}
                  onChange={(e) =>
                    setFormData({ ...formData, actualResult: e.target.value })
                  }
                  rows={3}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Severity
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      severity: e.target.value as
                        | "Low"
                        | "Medium"
                        | "High"
                        | "Critical",
                    })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  {severities.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as
                        | "Low"
                        | "Medium"
                        | "High"
                        | "Critical",
                    })
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
                    setFormData({
                      ...formData,
                      status: e.target.value as
                        | "Open"
                        | "InProgress"
                        | "Resolved"
                        | "Closed",
                    })
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
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Related Test Case ID (optional)
                </label>
                <input
                  name="testCaseId"
                  value={formData.testCaseId}
                  placeholder="e.g. TC-001 or database ID"
                  onChange={(e) =>
                    setFormData({ ...formData, testCaseId: e.target.value })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    submitting
                      ? "bg-slate-400 text-slate-200"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {submitting
                    ? "Saving…"
                    : formMode === "create"
                      ? "Report Defect"
                      : "Update Defect"}
                </button>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setFormMode(null);
                    setEditingId(null);
                    setFormError(null);
                  }}
                  className="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search & Filters */}
        {projectId && <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
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
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="">All severities</option>
            {severities.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
        </div>}

        {/* Defects table */}
        {projectId && <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Test Case</th>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Reported By</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-4 text-slate-500">
                    Loading defects…
                  </td>
                </tr>
              ) : defects.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    No defects found.
                  </td>
                </tr>
              ) : (
                defects.map((defect) => (
                  <tr
                    key={defect.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {defect.id.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-4">{defect.title}</td>
                    <td className="px-5 py-4">
                      {defect.testCase ? (
                        <>
                          <span className="text-xs text-slate-500 block">
                            {defect.testCase.testCaseId}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            {defect.testCase.title}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative">
                        <select
                          value={defect.severity}
                          onChange={(e) =>
                            handleInlineUpdate(
                              defect.id,
                              "severity",
                              e.target.value as
                                | "Low"
                                | "Medium"
                                | "High"
                                | "Critical",
                            )
                          }
                          className={`block w-full rounded border-none text-center px-2 py-1 text-xs font-medium focus:ring-0 outline-none cursor-pointer appearance-none pr-8 ${
                            defect.severity === "Critical"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : defect.severity === "High"
                                ? "bg-orange-100 text-orange-800 border-orange-200"
                                : defect.severity === "Low"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {severities.map((s) => (
                            <option key={s} value={s} className="text-xs">
                              {s}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                          <svg
                            className="w-3 h-3 text-black"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative">
                        <select
                          value={defect.priority}
                          onChange={(e) =>
                            handleInlineUpdate(
                              defect.id,
                              "priority",
                              e.target.value as
                                | "Low"
                                | "Medium"
                                | "High"
                                | "Critical",
                            )
                          }
                          className={`block w-full rounded border-none text-center px-2 py-1 text-xs font-medium focus:ring-0 outline-none cursor-pointer appearance-none pr-8 ${
                            defect.priority === "Critical"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : defect.priority === "High"
                                ? "bg-orange-100 text-orange-800 border-orange-200"
                                : defect.priority === "Low"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {priorities.map((p) => (
                            <option key={p} value={p} className="text-xs">
                              {p}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                          <svg
                            className="w-3 h-3 text-black"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative">
                        <select
                          value={defect.status}
                          onChange={(e) =>
                            handleInlineUpdate(
                              defect.id,
                              "status",
                              e.target.value as
                                | "Open"
                                | "InProgress"
                                | "Resolved"
                                | "Closed",
                            )
                          }
                          className={`block w-full rounded border-none text-center px-2 py-1 text-xs font-medium focus:ring-0 outline-none cursor-pointer appearance-none pr-8 ${
                            defect.status === "Resolved"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : defect.status === "Closed"
                                ? "bg-slate-100 text-slate-500 border-slate-200"
                                : defect.status === "InProgress"
                                  ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                                  : "bg-blue-100 text-blue-800 border-blue-200"
                          }`}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s} className="text-xs">
                              {s}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                          <svg
                            className="w-3 h-3 text-black"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {defect.reportedBy?.name ||
                        defect.reportedBy?.email ||
                        "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(defect)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(defect.id, defect.title)}
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
        </div>}

        {meta && (
          <p className="mt-4 text-xs text-slate-400">
            Showing {defects.length} of {meta.total} defects
          </p>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          TestForge · QA Management Platform
        </p>
      </section>
    </main>
  );
}
