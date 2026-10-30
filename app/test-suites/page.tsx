"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  FolderKanban,
  Layers3,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import TestSuiteCard from "@/components/cards/test-suite-card";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";

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

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-200 ${className}`}
    />
  );
}

function TestSuiteSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <Skeleton className="h-1 w-full rounded-none" />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-1 items-center gap-3">
                <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="mt-5 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-4/5" />
            <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-8" />
            </div>
            <Skeleton className="mt-5 h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SuiteFormSkeleton() {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-5 h-10 w-full rounded-xl" />
      <Skeleton className="mt-4 h-24 w-full rounded-xl" />
      <div className="mt-5 flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

const fieldClass =
  "block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";

export default function TestSuitesPage() {
  const router = useRouter();

  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    description: string;
  } | null>(null);
  const [editingSubmitting, setEditingSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [search, setSearch] = useState("");

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
    void fetchProjects();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("testforge_projectId");
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("projectId") || stored || null;

    if (pid) {
      setProjectId(pid);
      localStorage.setItem("testforge_projectId", pid);
    } else {
      setLoading(false);
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
        `/api/test-suites?projectId=${encodeURIComponent(projectId)}`,
        {
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        },
      );

      if (!res.ok) throw new Error("Failed to load test suites");

      const data: TestSuite[] = await res.json();
      setTestSuites(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchTestSuites();
  }, [fetchTestSuites]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!projectId) {
      setCreateError("Please select a project first");
      return;
    }

    setCreateSubmitting(true);

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
        err instanceof Error ? err.message : "Failed to create test suite",
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEdit = (suite: TestSuite) => {
    setEditFormData({
      name: suite.name,
      description: suite.description ?? "",
    });
    setEditingId(suite.id);
    setEditError(null);
    setCreating(false);
  };

  const handleEditSave = async (e: FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editingId || !editFormData) return;

    setEditingSubmitting(true);

    try {
      const res = await fetch(`/api/test-suites/${editingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name,
          description: editFormData.description || undefined,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setEditError(errorBody.error || "Failed to update test suite");
        return;
      }

      const updated = await res.json();
      setTestSuites((prev) =>
        prev.map((suite) => (suite.id === editingId ? updated : suite)),
      );
      setEditingId(null);
      setEditFormData(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update test suite",
      );
    } finally {
      setEditingSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
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

      setTestSuites((prev) => prev.filter((suite) => suite.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete test suite",
      );
    }
  };

  const openSuite = (suite: TestSuite) => {
    if (!projectId) return;

    localStorage.setItem("testforge_projectId", projectId);
    router.push(
      `/test-cases?projectId=${encodeURIComponent(projectId)}&suiteId=${encodeURIComponent(suite.id)}`,
    );
  };

  const selectedProject = projects.find((project) => project.id === projectId);
  const filteredSuites = testSuites.filter((suite) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      suite.name.toLowerCase().includes(query) ||
      (suite.description || "").toLowerCase().includes(query)
    );
  });

  const closeForms = () => {
    setCreating(false);
    setCreateError(null);
    setEditingId(null);
    setEditFormData(null);
    setEditError(null);
  };

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <section className="mx-auto w-full max-w-[1600px] p-5 md:p-8">
        {/* Page heading */}
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
              <Sparkles size={14} />
              Workspace
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              Test Suites
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Group related test cases and keep your testing organized.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreating((value) => !value);
              setEditingId(null);
              setEditFormData(null);
              setCreateError(null);
            }}
            disabled={!projectId}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? <X size={17} /> : <Plus size={17} />}
            {creating ? "Close form" : "New test suite"}
          </button>
        </header>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <CircleAlert size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto rounded-md p-1 hover:bg-rose-100"
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Project selector */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FolderKanban size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Project workspace
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {selectedProject
                  ? `Managing suites for ${selectedProject.name}`
                  : "Select a project to view its test suites"}
              </p>
            </div>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <select
              value={projectId || ""}
              onChange={(e) => {
                const value = e.target.value;
                setProjectId(value || null);
                localStorage.setItem("testforge_projectId", value || "");

                const params = new URLSearchParams(window.location.search);
                if (value) params.set("projectId", value);
                else params.delete("projectId");

                const query = params.toString();
                window.history.replaceState(
                  {},
                  "",
                  query
                    ? `${window.location.pathname}?${query}`
                    : window.location.pathname,
                );
              }}
              disabled={projectsLoading}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:opacity-60"
            >
              <option value="">
                {projectsLoading ? "Loading projects..." : "Select a project"}
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.key} - {project.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        {!projectId && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FolderKanban size={25} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900">
              Choose a project to get started
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Select a project from the dropdown above to view, create, and
              manage its test suites.
            </p>
          </div>
        )}

        {/* Create suite form */}
        {creating && projectId && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-indigo-50/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <Plus size={18} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Create test suite
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Add a new group of test cases to this project.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeForms}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
                aria-label="Close create form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 p-6">
              {createError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {createError}
                </div>
              )}
              <FormField label="Suite name">
                <input
                  name="name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="e.g. Authentication test suite"
                  className={fieldClass}
                  required
                  maxLength={100}
                />
              </FormField>
              <FormField label="Description (optional)">
                <textarea
                  name="description"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what this suite covers..."
                  rows={3}
                  className={`${fieldClass} resize-y`}
                />
              </FormField>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForms}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting || !createForm.name.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createSubmitting && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {createSubmitting ? "Creating..." : "Create test suite"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit suite form */}
        {editingId && editFormData && projectId && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Edit test suite
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Update the suite name or description.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeForms}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
                aria-label="Close edit form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-5 p-6">
              {editError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {editError}
                </div>
              )}
              <FormField label="Suite name">
                <input
                  name="name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev,
                    )
                  }
                  className={fieldClass}
                  required
                  maxLength={100}
                />
              </FormField>
              <FormField label="Description (optional)">
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev,
                    )
                  }
                  rows={3}
                  className={`${fieldClass} resize-y`}
                />
              </FormField>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForms}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingSubmitting || !editFormData.name.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingSubmitting && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {editingSubmitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Suite list */}
        {projectId && (
          <section className="mt-7">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Your test suites
                  </h2>
                  {!loading && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {testSuites.length}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Browse and manage the test suites in this project.
                </p>
              </div>

              {!loading && testSuites.length > 0 && (
                <div className="relative w-full sm:max-w-xs">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search test suites..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              )}
            </div>

            {loading ? (
              <TestSuiteSkeleton />
            ) : filteredSuites.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  {search ? <Search size={24} /> : <BookOpenCheck size={24} />}
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {search ? "No matching test suites" : "No test suites yet"}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  {search
                    ? "Try another search term or clear your search."
                    : "Create your first test suite to organize related test cases for this project."}
                </p>
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Clear search
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <Plus size={16} /> Create first suite
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredSuites.map((suite) => (
                  <TestSuiteCard
                    key={suite.id}
                    suite={suite}
                    onOpen={() => openSuite(suite)}
                    onEdit={() => openEdit(suite)}
                    onDelete={() => void handleDelete(suite.id, suite.name)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="py-8 text-center text-xs font-medium text-slate-400">
          TestForge · QA Management Platform
        </footer>
      </section>
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Test Suite"
        message={`Are you sure you want to delete test suite "${deleteTarget?.name ?? ""}"?`}
        danger
      />
    </main>
  );
}
