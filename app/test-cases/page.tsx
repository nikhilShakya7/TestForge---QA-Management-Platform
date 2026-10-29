"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/sidebar";

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
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  data: TestCase[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

type PriorityBadgeProps = { priority: string };
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

  const fetchTestCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterPriority) params.set("priority", filterPriority);
      if (filterStatus) params.set("status", filterStatus);
      params.set("page", "1");
      params.set("pageSize", "50");

      const res = await fetch(`/api/test-cases?${params.toString()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load test cases");
      }

      const json: ApiResponse = await res.json();
      setTestCases(json.data);
      setMeta(json.meta);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [search, filterPriority, filterStatus]);

  useEffect(() => {
    fetchTestCases();
  }, [fetchTestCases]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const res = await fetch("/api/test-cases", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          suiteId: formData.suiteId || null,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        setFormError(errorBody.error || "Failed to create test case");
        return;
      }

      const newCase = await res.json();
      setTestCases((prev) => [newCase, ...prev]);
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
      // Refresh to update meta counts
      fetchTestCases();
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
        throw new Error("Failed to delete test case");
      }

      setTestCases((prev) => prev.filter((tc) => tc.id !== id));
      fetchTestCases();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete test case"
      );
    }
  };

  const priorities = ["Low", "Medium", "High", "Critical"];
  const statuses = ["Draft", "Active", "Archived"];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <Sidebar />

      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Test Cases</h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage your test cases.
            </p>
          </div>

          <button
            onClick={() => setCreating(!creating)}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            {creating ? "Cancel" : "+ New Test Case"}
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Search & Filters */}
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

        {/* Create form */}
        {creating && (
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

        {/* Test cases table */}
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
                    className="hover:bg-slate-50 transition-colors"
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
                      <button
                        onClick={() => handleDelete(tc.id, tc.testCaseId)}
                        className="text-sm text-red-600 hover:text-red-700 underline underline-offset-4"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && (
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
