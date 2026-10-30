"use client";

type StatusBadgeProps = {
  status: string;
  size?: "sm" | "md";
};

const STATUS_VARIANTS: Record<string, string> = {
  Passed: "bg-emerald-50 text-emerald-700",
  Failed: "bg-red-50 text-red-700",
  Blocked: "bg-amber-50 text-amber-700",
  Active: "bg-blue-50 text-blue-700",
  Draft: "bg-slate-50 text-slate-700",
  Archived: "bg-slate-100 text-slate-500",
  Open: "bg-blue-50 text-blue-700",
  Resolved: "bg-emerald-50 text-emerald-700",
  Closed: "bg-slate-100 text-slate-500",
  Planned: "bg-slate-50 text-slate-700",
  InProgress: "bg-indigo-50 text-indigo-700",
  "In Progress": "bg-indigo-50 text-indigo-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-500",
  "Not Run": "bg-slate-100 text-slate-600",
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full ${sizeClass} text-xs font-medium ${STATUS_VARIANTS[status] ?? STATUS_VARIANTS.Draft}`}>
      {status}
    </span>
  );
}
