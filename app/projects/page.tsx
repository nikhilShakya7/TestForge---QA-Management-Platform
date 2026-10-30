"use client";

import { useEffect, useState, useCallback } from "react";

type Project = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
  _count: { testCases: number; testRuns: number; defects: number };
};

type ProjectResponse = {
  data: Project[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

type StatusBadgeProps = { status: string };
function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    ARCHIVED: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[status] ?? variants["ACTIVE"]}`}
    >
      {status}
    </span>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ProjectResponse["meta"] | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const statuses = ["ACTIVE", "ARCHIVED"];

  // Create form state
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<{
    name: string;
    key: string;
    description: string;
    status: "ACTIVE" | "ARCHIVED";
  }>({
    name: "",
    key: "",
    description: "",
    status: "ACTIVE",
  });

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    key: string;
    description: string;
    status: "ACTIVE" | "ARCHIVED";
  }>({
    name: "",
    key: "",
    description: "",
    status: "ACTIVE",
  });

  // Submitting states
  const [creatingSubmitting, setCreatingSubmitting] = useState(false);
  const [editingSubmitting, setEditingSubmitting] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      params.set("page", "1");
      params.set("pageSize", "50");

      const res = await fetch(`/api/projects?${params.toString()}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load projects");
      }

      const json: ProjectResponse = await res.json();
      setProjects(json.data);
      setMeta(json.meta);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreatingSubmitting(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          key: createForm.key.toUpperCase(),
          description: createForm.description || undefined,
          status: createForm.status,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setCreateError(errorBody.error || "Failed to create project");
        setCreatingSubmitting(false);
        return;
      }

      const newProject = await res.json();
      setProjects((prev) => [newProject, ...prev]);
      setCreating(false);
      setCreateForm({ name: "", key: "", description: "", status: "ACTIVE" });
      setCreateError(null);
      await fetchProjects();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create project");
      setCreatingSubmitting(false);
    } finally {
      setCreatingSubmitting(false);
    }
  };

  const openEdit = (project: Project) => {
    setEditForm({
      name: project.name,
      key: project.key,
      description: project.description || "",
      status: project.status as "ACTIVE" | "ARCHIVED",
    });
    setEditingId(project.id);
    setEditError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditError(null);
    setEditingSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${editingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          key: editForm.key.toUpperCase(),
          description: editForm.description || undefined,
          status: editForm.status,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setEditError(errorBody.error || "Failed to update project");
        setEditingSubmitting(false);
        return;
      }

      const updated = await res.json();
      setProjects((prev) =>
        prev.map((p) => (p.id === editingId ? updated : p))
      );
      setEditingId(null);
      setEditError(null);
      await fetchProjects();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update project");
      setEditingSubmitting(false);
    } finally {
      setEditingSubmitting(false);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Archive project "${name}"? This cannot be undone if the project has test cases, test runs, or defects.`
      )
    )
      return;

    setArchivingId(id);

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setError(errorBody.error || "Failed to archive project");
        setArchivingId(null);
        return;
      }

      setProjects((prev) => prev.filter((p) => p.id !== id));
      setArchivingId(null);
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive project");
      setArchivingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your testing projects. Each project has its own test cases,
              test runs, and defects.
            </p>
          </div>

          <button
            onClick={() => setCreating(!creating)}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            {creating ? "Cancel" : "+ New Project"}
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Create project form */}
        {creating && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
            {createError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Project Name
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
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Project Key (e.g. ECM)
                </label>
                <input
                  name="key"
                  value={createForm.key}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, key: e.target.value.toUpperCase() })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm uppercase focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                  maxLength={10}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Short unique identifier (uppercase, letters and numbers only)
                </p>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                  rows={3}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, status: e.target.value as "ACTIVE" | "ARCHIVED" })
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
                  disabled={creatingSubmitting}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    creatingSubmitting
                      ? "bg-slate-400 text-slate-200"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {creatingSubmitting ? "Creating…" : "Create Project"}
                </button>
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-end">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search & Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, key, or description…"
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
        </div>

        {/* Projects table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Key</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Test Cases</th>
                <th className="px-5 py-3 font-medium text-right">Test Runs</th>
                <th className="px-5 py-3 font-medium text-right">Defects</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Loading projects…
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {project.key}
                    </td>
                    <td className="px-5 py-4">{project.name}</td>
                    <td className="px-5 py-4">
                      {project.description ? (
                        <span className="text-sm text-slate-600">
                          {project.description}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-medium">{project._count.testCases}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-medium">{project._count.testRuns}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-medium">{project._count.defects}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        {project.status === "ARCHIVED" ? (
                          <button
                            onClick={() => openEdit(project)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                          >
                            Restore
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openEdit(project)}
                              className="text-xs text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleArchive(project.id, project.name)}
                              className="text-xs text-red-600 hover:text-red-700 underline underline-offset-4"
                            >
                              Archive
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && (
          <p className="mt-4 text-xs text-slate-400">
            Showing {projects.length} of {meta.total} projects
          </p>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          TestForge · QA Management Platform
        </p>
      </section>
    </main>
  );
}
