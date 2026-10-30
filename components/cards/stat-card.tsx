"use client";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "blue" | "emerald" | "red" | "amber" | "indigo" | "slate";
  trend?: string;
  trendDirection?: "up" | "down";
};

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  red: "bg-red-50 text-red-600 border-red-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  slate: "bg-slate-50 text-slate-600 border-slate-100",
};

export default function StatCard({
  title,
  value,
  icon,
  color = "slate",
  trend,
  trendDirection,
}: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`rounded-md p-2.5 ${colorMap[color]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      {trend && (
        <p className={`mt-1 text-xs font-medium ${
          trendDirection === "up"
            ? "text-emerald-600"
            : "text-red-600"
        }`}>
          {trendDirection === "up" ? "▲ " : "▼ "}{trend}
        </p>
      )}
    </article>
  );
}
