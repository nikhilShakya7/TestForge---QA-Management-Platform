"use client";

import {
  FolderKanban,
  Pencil,
  Trash2,
  ArrowUpRight,
  CalendarDays,
  FileText,
} from "lucide-react";

type TestSuiteCardProps = {
  suite: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    _count: { testCases: number };
  };
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function TestSuiteCard({
  suite,
  onOpen,
  onEdit,
  onDelete,
}: TestSuiteCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/40">
      {/* Top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400" />

      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <FolderKanban size={21} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-900">
                {suite.name}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">Test Suite</p>
            </div>
          </div>

          {/* Case count */}
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/70">
            <FileText size={13} />
            {suite._count?.testCases ?? 0}
          </span>
        </div>

        {/* Description */}
        <p className="mt-5 min-h-[40px] text-sm leading-6 text-slate-500">
          {suite.description || "No description provided for this test suite."}
        </p>

        {/* Metadata */}
        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
          <CalendarDays size={14} />
          <span>Created {new Date(suite.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-5">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Open Suite
            <ArrowUpRight size={16} />
          </button>

          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${suite.name}`}
            title="Edit suite"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${suite.name}`}
            title="Delete suite"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
