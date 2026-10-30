"use client";

import StatusBadge from "@/components/cards/status-badge";

type TestResultCardProps = {
  testCaseId: string;
  title: string;
  status: string;
  expectedResult?: string | null;
  actualResult?: string | null;
  notes?: string | null;
  executedAt?: string | null;
  executedBy?: string | null;
  editable?: boolean;
  onStatusChange?: (status: "Passed" | "Failed" | "Blocked") => void;
  onActualResultChange?: (value: string) => void;
  onNotesChange?: (value: string) => void;
  onUpdate?: () => void;
  onViewHistory?: () => void;
};

const resultStatuses = ["Passed", "Failed", "Blocked"] as const;

export default function TestResultCard({
  testCaseId,
  title,
  status,
  expectedResult,
  actualResult,
  notes,
  executedAt,
  executedBy,
  editable = false,
  onStatusChange,
  onActualResultChange,
  onNotesChange,
  onUpdate,
  onViewHistory,
}: TestResultCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {testCaseId}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{title}</h3>
        </div>
        <StatusBadge status={status} />
      </header>

      {editable && onStatusChange && (
        <div className="mt-4 flex flex-wrap gap-2">
          {resultStatuses.map((resultStatus) => (
            <button
              key={resultStatus}
              type="button"
              onClick={() => onStatusChange(resultStatus)}
              aria-pressed={status === resultStatus}
              className={`min-h-10 rounded-lg border px-3 py-2 text-sm font-medium ${
                status === resultStatus
                  ? resultStatus === "Passed"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : resultStatus === "Failed"
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-amber-500 bg-amber-500 text-white"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {resultStatus}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <section className="rounded-lg bg-slate-50 p-3">
          <h4 className="text-xs font-medium text-slate-500">Expected result</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
            {expectedResult || "Not specified"}
          </p>
        </section>
        <section className="rounded-lg bg-slate-50 p-3">
          <h4 className="text-xs font-medium text-slate-500">Actual result</h4>
          {editable && onActualResultChange ? (
            <textarea
              value={actualResult || ""}
              onChange={(event) => onActualResultChange(event.target.value)}
              rows={2}
              className="mt-1 block w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Record the observed result…"
            />
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
              {actualResult || "Not recorded"}
            </p>
          )}
        </section>
      </div>

      <section className="mt-3 rounded-lg border border-slate-100 p-3">
        <h4 className="text-xs font-medium text-slate-500">Execution notes</h4>
        {editable && onNotesChange ? (
          <textarea
            value={notes || ""}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={2}
            className="mt-1 block w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Add notes for this execution…"
          />
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
            {notes || "No notes"}
          </p>
        )}
      </section>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {executedAt ? new Date(executedAt).toLocaleString() : "Not run yet"}
          {executedBy ? ` · ${executedBy}` : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {onViewHistory && (
            <button
              type="button"
              onClick={onViewHistory}
              className="min-h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View History
            </button>
          )}
          {onUpdate && (
            <button
              type="button"
              onClick={onUpdate}
              className="min-h-10 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Update Result
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}
