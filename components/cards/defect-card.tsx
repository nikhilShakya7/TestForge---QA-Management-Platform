"use client";

import {
  Bug,
  CalendarDays,
  UserRound,
  AlertCircle,
  Flag,
  Link2,
  Pencil,
  Trash2,
  ArrowUpRight,
} from "lucide-react";

type DefectCardProps = {
  defect: {
    id: string;
    title: string;
    description: string | null;
    reproSteps: string | null;
    severity: string;
    priority: string;
    status: string;
    testCase: { id: string; testCaseId: string; title: string } | null;
    reportedBy: { id: string; name: string | null; email: string } | null;
    createdAt: string;
  };
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onInlineUpdate: (
    field: "severity" | "priority" | "status",
    value: string,
  ) => void;
};

const severityStyles: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-100",
  High: "bg-orange-50 text-orange-700 border-orange-100",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  Low: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const severityAccent: Record<string, string> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-amber-500",
  Low: "bg-emerald-500",
};

const statusStyles: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700 border-blue-100",
  InProgress: "bg-indigo-50 text-indigo-700 border-indigo-100",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Closed: "bg-slate-100 text-slate-600 border-slate-200",
};

function InlineSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1 block text-[11px] font-medium text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-indigo-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "InProgress" ? "In Progress" : option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function DefectCard({
  defect,
  onOpen,
  onEdit,
  onDelete,
  onInlineUpdate,
}: DefectCardProps) {
  const severity = severityStyles[defect.severity] ? defect.severity : "Medium";

  const status = statusStyles[defect.status] ? defect.status : "Open";

  const reporterName =
    defect.reportedBy?.name || defect.reportedBy?.email || "Unknown";

  return (
    <article
      onClick={onOpen}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/50"
    >
      <div className={`h-1 w-full ${severityAccent[severity]}`} />

      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100">
              <Bug size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Defect
              </p>
              <h3 className="mt-0.5 line-clamp-2 text-base font-bold text-slate-900">
                {defect.title}
              </h3>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
          >
            {status === "InProgress" ? "In Progress" : status}
          </span>
        </div>

        {/* Severity and priority */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${severityStyles[severity]}`}
          >
            <AlertCircle size={13} />
            {severity}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            <Flag size={13} />
            {defect.priority} Priority
          </span>
        </div>

        {/* Description */}
        <p className="mt-4 min-h-[40px] line-clamp-2 text-sm leading-5 text-slate-500">
          {defect.reproSteps ||
            defect.description ||
            "No description provided."}
        </p>

        {/* Linked test case */}
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-2">
            <Link2 size={15} className="text-indigo-600" />
            <p className="text-xs font-semibold text-slate-500">
              Linked Test Case
            </p>
          </div>

          {defect.testCase ? (
            <div className="mt-2">
              <p className="text-sm font-semibold text-indigo-600">
                {defect.testCase.testCaseId}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                {defect.testCase.title}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400">No test case linked</p>
          )}
        </div>

        {/* Inline controls */}
        <div
          className="mt-4 grid grid-cols-3 gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <InlineSelect
            label="Severity"
            value={defect.severity}
            options={["Critical", "High", "Medium", "Low"]}
            onChange={(value) => onInlineUpdate("severity", value)}
          />

          <InlineSelect
            label="Priority"
            value={defect.priority}
            options={["Critical", "High", "Medium", "Low"]}
            onChange={(value) => onInlineUpdate("priority", value)}
          />

          <InlineSelect
            label="Status"
            value={defect.status}
            options={["Open", "InProgress", "Resolved", "Closed"]}
            onChange={(value) => onInlineUpdate("status", value)}
          />
        </div>

        {/* Reporter and date */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4 mt-5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <UserRound size={15} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">Reported by</p>
              <p className="truncate text-xs font-semibold text-slate-700">
                {reporterName}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
            <CalendarDays size={14} />
            {new Date(defect.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            View Defect
            <ArrowUpRight size={15} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label="Edit defect"
            title="Edit defect"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete defect"
            title="Delete defect"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
