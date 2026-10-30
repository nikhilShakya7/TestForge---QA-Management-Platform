"use client";

import { useEffect, useState, useCallback } from "react";

type TestSuite = {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
  _count: { testCases: number };
};

type Project = {
  id: string;
  name: string;
  key: string;
};

type TestSuiteResponse = TestSuite[];

export default function TestSuitesPage() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Project selection
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Create form state
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
  });

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    description: string;
  } | null>(null);
  const [editingSubmitting, setEditingSubmitting] = useState(false);

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

  const fetchTestSuites = useCallback(async () => {
    if (!projectId) {
      setTestSuites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/test-suites?projectId=${projectId}`,
        {
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error("Failed to load test suites");
      const data: TestSuite[] = await res.json();
      setError(null);
      setTestSuites(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTestSuites();
  }, [fetchTestSuites]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!projectId) {
      setCreateError("Please select a project first");
      return;
    }

    try {
      const res = await fetch("/api/test-suites", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description || undefined,
          projectId,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setCreateError(errorBody.error || "Failed to create test suite");
        return;
      }

      const newSuite = await res.json();
      setTestSuites((prev) => [newSuite, ...prev]);
      setCreating(false);
      setCreateForm({ name: "", description: "" });
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create test suite"
      );
    }
  };

  const openEdit = (suite: TestSuite) => {
    setEditFormData({
      name: suite.name,
      description: suite.description ?? "",
    });
    setEditingId(suite.id);
    setEditError(null);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditingSubmitting(true);

    if (!editingId) return;

    try {
      const res = await fetch(`/api/test-suites/${editingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData?.name,
          description: editFormData?.description || undefined,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setEditError(errorBody.error || "Failed to update test suite");
        setEditingSubmitting(false);
        return;
      }

      const updated = await res.json();
      setTestSuites((prev) =>
        prev.map((ts) => (ts.id === editingId ? updated : ts))
      );
      setEditingId(null);
      setEditFormData(null);
      setEditError(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update test suite"
      );
    } finally {
      setEditingSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete test suite "${name}"?`)) return;

    try {
      const res = await fetch(`/api/test-suites/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setError(errorBody.error || "Failed to delete test suite");
        return;
      }

      setTestSuites((prev) => prev.filter((ts) => ts.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete test suite"
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Test Suites</h2>
            <p className="mt-1 text-sm text-slate-500">
              Organize test cases into suites within your project.
            </p>
          </div>

          <button
            onClick={() => setCreating(!creating)}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            {creating ? "Cancel" : "+ New Suite"}
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
                window.history.replaceState(
                  {},
                  "",
                  `${window.location.pathname}?${params.toString()}`
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
              Viewing test suites for selected project. Create new suites
              will be assigned to this project.
            </p>
          )}
        </div>

        {!projectId && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              Please select a project to view and manage test suites.
            </p>
          </div>
        )}

        {/* Create suite form */}
        {creating && projectId && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Create Test Suite</h3>
            {createError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Suite Name
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
                <textarea
                  name="description"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Create Test Suite
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

        {/* Edit suite form */}
        {editingId && editFormData && projectId && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Edit Test Suite</h3>
            {editError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {editError}
              </div>
            )}
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Suite Name
                </label>
                <input
                  name="name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev
                    )
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev
                    )
                  }
                  rows={3}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editingSubmitting}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    editingSubmitting
                      ? "bg-slate-400 text-slate-200"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {editingSubmitting ? "Updating…" : "Update Test Suite"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditFormData(null);
                    setEditError(null);
                  }}
                  className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Test suites table */}
        {projectId && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium text-right">Test Cases</th>
                  <th className="px-5 py-3 font-medium">Created By</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      Loading test suites…
                    </td>
                  </tr>
                ) : testSuites.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      No test suites found.
                    </td>
                  </tr>
                ) : (
                  testSuites.map((suite) => (
                    <tr
                      key={suite.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {suite.name}
                      </td>
                      <td className="px-5 py-4">
                        {suite.description ? (
                          <span className="text-sm text-slate-600">
                            {suite.description}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-medium">
                          {suite._count?.testCases ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {suite.createdBy?.name ||
                          suite.createdBy?.email ||
                          "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(suite)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(suite.id, suite.name)}
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

        <p className="mt-8 text-center text-xs text-slate-400">
          TestForge · QA Management Platform
        </p>
      </section>
    </main>
  );
}
