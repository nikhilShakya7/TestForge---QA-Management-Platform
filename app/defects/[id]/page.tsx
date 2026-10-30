"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
  projectId: string | null;
  reportedBy: { id: string; name: string | null; email: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
};

export default function DefectDetailPage() {
  const [defect, setDefect] = useState<Defect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id: defectId } = useParams<{ id: string }>();

  useEffect(() => {
    async function fetchDefect() {
      try {
        const res = await fetch(`/api/defects/${defectId}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load defect");
        const data: Defect = await res.json();
        setDefect(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load defect");
      } finally {
        setLoading(false);
      }
    }

    void fetchDefect();
  }, [defectId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
        <section className="min-w-0 flex-1 p-5 md:p-8">
          <h2 className="text-2xl font-bold">Defect</h2>
          <div className="mt-8 px-5 py-8 text-center text-slate-500">
            Loading defect…
          </div>
        </section>
      </main>
    );
  }

  if (!defect) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
        <section className="min-w-0 flex-1 p-5 md:p-8">
          <h2 className="text-2xl font-bold">Defect</h2>
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500 mb-4">{error}</p>
            <button
              onClick={() => (window.location.href = "/defects")}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Back to Defects
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{defect.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Defect details
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                window.location.href = `/defects?${params.toString()}`;
              }}
              className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
            >
              Back to List
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Defect ID</p>
            <p className="mt-1 text-sm font-medium">{defect.id.slice(0, 8)}…</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-1 text-sm font-medium">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${defect.status === "Open" ? "bg-blue-50 text-blue-700" : defect.status === "InProgress" ? "bg-indigo-50 text-indigo-700" : defect.status === "Resolved" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {defect.status}
              </span>
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Severity</p>
            <p className="mt-1 text-sm font-medium">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${defect.severity === "Critical" ? "bg-red-100 text-red-800" : defect.severity === "High" ? "bg-orange-100 text-orange-800" : defect.severity === "Low" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                {defect.severity}
              </span>
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Priority</p>
            <p className="mt-1 text-sm font-medium">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${defect.priority === "Critical" ? "bg-red-100 text-red-800" : defect.priority === "High" ? "bg-orange-100 text-orange-800" : defect.priority === "Low" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                {defect.priority}
              </span>
            </p>
          </article>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Description</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {defect.description || "No description provided"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Reproduction Steps</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {defect.reproSteps || "No reproduction steps provided"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Expected Result</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {defect.expectedResult || "No expected result provided"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Actual Result</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {defect.actualResult || "No actual result provided"}
            </p>
          </article>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-3">Related Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Test Case</p>
              <p className="mt-1 text-sm text-slate-600">
                {defect.testCase ? `${defect.testCase.testCaseId} — ${defect.testCase.title}` : "None"}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Reported By</p>
              <p className="mt-1 text-sm text-slate-600">
                {defect.reportedBy?.name || defect.reportedBy?.email || "—"}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Assignee</p>
              <p className="mt-1 text-sm text-slate-600">
                {defect.assignee?.name || defect.assignee?.email || "Unassigned"}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Created</p>
              <p className="mt-1 text-sm text-slate-600">
                {new Date(defect.createdAt).toLocaleString()}
              </p>
            </article>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          TestForge · QA Management Platform
        </p>
      </section>
    </main>
  );
}
