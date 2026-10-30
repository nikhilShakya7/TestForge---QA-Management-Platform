"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  AlertCircle,
  Bug,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Flag,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

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

type FormData = {
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
};

const statuses = ["Open", "InProgress", "Resolved", "Closed"];
const severities = ["Low", "Medium", "High", "Critical"];
const priorities = ["Low", "Medium", "High", "Critical"];

const initialFormData: FormData = {
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
};

const severityStyles: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 ring-red-200",
  High: "bg-orange-50 text-orange-700 ring-orange-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const statusStyles: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700 ring-blue-200",
  InProgress: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Closed: "bg-slate-100 text-slate-600 ring-slate-200",
};

const priorityStyles: Record<string, string> = {
  Critical: "bg-red-50 text-red-700",
  High: "bg-orange-50 text-orange-700",
  Medium: "bg-slate-100 text-slate-700",
  Low: "bg-emerald-50 text-emerald-700",
};

const severityAccent: Record<string, string> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-amber-500",
  Low: "bg-emerald-500",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatStatus(status: string) {
  return status === "InProgress" ? "In Progress" : status;
}

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

function InlineSelect({
  label,
  value,
  options,
  onChange,
  styles,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  styles: Record<string, string>;
}) {
  return (
    <label className="block min-w-0" onClick={(e) => e.stopPropagation()}>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>

      <div className="relative">
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full cursor-pointer appearance-none rounded-lg border-0 py-2 pl-3 pr-8 text-xs font-semibold outline-none ring-1 ring-inset ring-transparent transition hover:ring-slate-200 focus:ring-2 focus:ring-indigo-500 ${
            styles[value] ?? "bg-slate-100 text-slate-700"
          }`}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {formatStatus(option)}
            </option>
          ))}
        </select>

        <ChevronDown
          size={13}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60"
        />
      </div>
    </label>
  );
}

function DefectCard({
  defect,
  onOpen,
  onEdit,
  onDelete,
  onInlineUpdate,
}: {
  defect: Defect;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onInlineUpdate: (
    field: "severity" | "priority" | "status",
    value: string,
  ) => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div
        className={`h-1 w-full ${
          severityAccent[defect.severity] ?? "bg-slate-400"
        }`}
      />

      <div className="flex flex-1 flex-col p-5">
        {/* Card heading */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Bug size={19} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                DEF-{defect.id.slice(0, 8)}
              </p>
              <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-900 group-hover:text-indigo-700">
                {defect.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            aria-label="Open defect"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
          >
            <ExternalLink size={16} />
          </button>
        </div>

        {/* Description */}
        <p className="mt-4 min-h-[40px] text-sm leading-5 text-slate-500 line-clamp-2">
          {defect.description || "No description provided."}
        </p>

        {/* Linked test case */}
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <ClipboardList size={14} />
            Related test case
          </div>

          {defect.testCase ? (
            <div className="mt-1.5 min-w-0">
              <p className="text-xs font-semibold text-indigo-600">
                {defect.testCase.testCaseId}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-600">
                {defect.testCase.title}
              </p>
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">No test case linked</p>
          )}
        </div>

        {/* Editable fields */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <InlineSelect
            label="Severity"
            value={defect.severity}
            options={severities}
            styles={severityStyles}
            onChange={(value) => onInlineUpdate("severity", value)}
          />

          <InlineSelect
            label="Priority"
            value={defect.priority}
            options={priorities}
            styles={priorityStyles}
            onChange={(value) => onInlineUpdate("priority", value)}
          />

          <InlineSelect
            label="Status"
            value={defect.status}
            options={statuses}
            styles={statusStyles}
            onChange={(value) => onInlineUpdate("status", value)}
          />
        </div>

        {/* Footer details */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
            <UserRound size={14} className="shrink-0 text-slate-400" />
            <span className="truncate">
              {defect.reportedBy?.name ||
                defect.reportedBy?.email ||
                "Unknown reporter"}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
            <CalendarDays size={13} />
            {formatDate(defect.createdAt)}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            View details
            <span className="ml-1">→</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label="Edit defect"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Pencil size={15} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Delete defect"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function DefectsPage() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DefectResponse["meta"] | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const fetchRequestId = useRef(0);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // Create / edit form
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

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
      setError(err instanceof Error ? err.message : "Failed to load projects");
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

      if (!res.ok) throw new Error("Failed to load defects");

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
        return;
      }

      const newDefect = await res.json();

      setDefects((prev) => [newDefect, ...prev]);
      setFormMode(null);
      setEditingId(null);
      setFormData(initialFormData);

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

      if (!res.ok) throw new Error("Failed to delete defect");

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
        setDefects(previous);
        const errorBody = await res.json();
        setError(errorBody.error || `Failed to update ${field}`);
        return;
      }

      const updated = await res.json();

      setDefects((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (err) {
      setDefects(previous);
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
      severity: defect.severity,
      priority: defect.priority,
      status: defect.status,
      testCaseId: defect.testCaseId ?? "",
      assigneeId: defect.assignee?.id ?? "",
    });

    setEditingId(defect.id);
    setFormError(null);
    setFormMode("edit");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDefect = (id: string) => {
    window.location.href = `/defects/${id}`;
  };

  const handleProjectChange = (selectedProjectId: string) => {
    fetchRequestId.current += 1;
    setDefects([]);
    setMeta(null);
    setError(null);
    setLoading(Boolean(selectedProjectId));
    setProjectId(selectedProjectId || null);

    if (selectedProjectId) {
      localStorage.setItem("testforge_projectId", selectedProjectId);
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
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  };

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("");
    setFilterSeverity("");
    setFilterPriority("");
  };

  const hasFilters = search || filterStatus || filterSeverity || filterPriority;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <section className="min-w-0 flex-1 p-5 md:p-8">
        {/* Page header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Bug size={19} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Defects
              </h1>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Report, manage, and track defects found during testing.
            </p>
          </div>

          <button
            type="button"
            disabled={!projectId}
            onClick={() => {
              if (formMode === "create") {
                setFormMode(null);
                setFormError(null);
              } else {
                setFormMode("create");
                setEditingId(null);
                setFormData(initialFormData);
                setFormError(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {formMode === "create" ? <X size={16} /> : <Plus size={17} />}
            {formMode === "create" ? "Cancel" : "Report Defect"}
          </button>
        </header>

        {/* Error message */}
        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="rounded p-1 hover:bg-red-100"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Project selection */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="defect-project"
              className="text-sm font-semibold text-slate-700"
            >
              Project
            </label>

            <select
              id="defect-project"
              value={projectId ?? ""}
              onChange={(e) => handleProjectChange(e.target.value)}
              disabled={projectsLoading}
              className="min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.key} - {project.name}
                </option>
              ))}
            </select>

            {projectsLoading && (
              <span className="text-xs text-slate-400">
                Loading projects...
              </span>
            )}

            {projectId && (
              <span className="ml-auto text-xs text-slate-400">
                Showing defects for selected project
              </span>
            )}
          </div>
        </div>

        {/* No project selected */}
        {!projectId && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={19} className="mt-0.5 text-amber-600" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  No project selected
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  Please select a project to view and manage its defects.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit form */}
        {formMode && projectId && (
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {formMode === "create" ? "Report New Defect" : "Edit Defect"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {formMode === "create"
                    ? "Provide the details of the issue you discovered."
                    : "Update the defect information below."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFormMode(null);
                  setEditingId(null);
                  setFormError(null);
                }}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {formError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <form
                onSubmit={formMode === "create" ? handleCreate : handleUpdate}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2"
              >
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter a short defect title"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the issue..."
                    rows={3}
                    className="w-full resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Reproduction Steps
                  </label>
                  <textarea
                    name="reproSteps"
                    value={formData.reproSteps}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reproSteps: e.target.value,
                      })
                    }
                    placeholder="1. Navigate to..."
                    rows={3}
                    className="w-full resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Expected Result
                  </label>
                  <textarea
                    name="expectedResult"
                    value={formData.expectedResult}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectedResult: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="What should happen?"
                    className="w-full resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Actual Result
                  </label>
                  <textarea
                    name="actualResult"
                    value={formData.actualResult}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        actualResult: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="What actually happened?"
                    className="w-full resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Severity
                  </label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {severities.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {formatStatus(s)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Related Test Case ID (optional)
                  </label>
                  <input
                    name="testCaseId"
                    value={formData.testCaseId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        testCaseId: e.target.value,
                      })
                    }
                    placeholder="e.g. TC-001 or database ID"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode(null);
                      setEditingId(null);
                      setFormError(null);
                    }}
                    className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? "Saving..."
                      : formMode === "create"
                        ? "Report Defect"
                        : "Update Defect"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search and filters */}
        {projectId && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Filter defects
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Find defects using keywords or filters.
                </p>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search defects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <select
                aria-label="Filter by status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {formatStatus(s)}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by severity"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All severities</option>
                {severities.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by priority"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All priorities</option>
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Defect cards */}
        {projectId && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  All Defects
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {loading
                    ? "Loading defects..."
                    : `${defects.length} defects displayed`}
                  {meta ? ` · ${meta.total} total` : ""}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="h-1 bg-slate-200" />
                    <div className="animate-pulse p-5">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100" />
                        <div className="flex-1">
                          <div className="h-3 w-20 rounded bg-slate-100" />
                          <div className="mt-2 h-4 w-3/4 rounded bg-slate-100" />
                        </div>
                      </div>
                      <div className="mt-5 h-4 w-full rounded bg-slate-100" />
                      <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
                      <div className="mt-5 h-16 rounded-lg bg-slate-100" />
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <div className="h-12 rounded-lg bg-slate-100" />
                        <div className="h-12 rounded-lg bg-slate-100" />
                        <div className="h-12 rounded-lg bg-slate-100" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : defects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Bug size={22} />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  No defects found
                </h3>

                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  {hasFilters
                    ? "No defects match your current filters. Try changing or clearing your filters."
                    : "There are no defects for this project yet. Report a defect to get started."}
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Clear filters
                    </button>
                  )}

                  {!hasFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormMode("create");
                        setFormData(initialFormData);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      <Plus size={16} />
                      Report Defect
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {defects.map((defect) => (
                  <DefectCard
                    key={defect.id}
                    defect={defect}
                    onOpen={() => openDefect(defect.id)}
                    onEdit={() => openEdit(defect)}
                    onDelete={() => handleDelete(defect.id, defect.title)}
                    onInlineUpdate={(field, value) =>
                      handleInlineUpdate(defect.id, field, value)
                    }
                  />
                ))}
              </div>
            )}

            {meta && !loading && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">
                  Showing {defects.length} of {meta.total} defects
                </p>

                <p className="text-xs text-slate-400">
                  Page {meta.page} of {meta.totalPages}
                </p>
              </div>
            )}
          </>
        )}

        <footer className="mt-10 pb-4 text-center text-xs text-slate-400">
          TestForge · QA Management Platform
        </footer>
      </section>
    </main>
  );
}
