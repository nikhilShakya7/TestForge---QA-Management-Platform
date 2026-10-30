"use client";

type PriorityBadgeProps = {
  priority: string;
};

const PRIORITY_VARIANTS: Record<string, string> = {
  Critical: "bg-red-50 text-red-700",
  High: "bg-orange-50 text-orange-700",
  Medium: "bg-slate-50 text-slate-700",
  Low: "bg-emerald-50 text-emerald-700",
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_VARIANTS[priority] ?? PRIORITY_VARIANTS["Medium"]}`}>
      {priority}
    </span>
  );
}
