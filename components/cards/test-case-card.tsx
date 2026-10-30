"use client";

import {
  ClipboardCheck,
  FolderKanban,
  ArrowUpRight,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";

import StatusBadge from "@/components/cards/status-badge";
import PriorityBadge from "@/components/cards/priority-badge";

type TestCaseCardProps = {
  testCase: {
    id: string;
    testCaseId: string;
    title: string;
    description: string | null;
    expectedResult: string;
    priority: string;
    status: string;
    suite?: { id: string; name: string } | null;
  };
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function TestCaseCard({
  testCase,
  onOpen,
  onEdit,
  onDelete,
}: TestCaseCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/50">
      {/* Top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />

      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
              <ClipboardCheck size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                {testCase.testCaseId}
              </p>
              <h3 className="mt-0.5 line-clamp-1 text-base font-bold text-slate-900">
                {testCase.title}
              </h3>
            </div>
          </div>

          <StatusBadge status={testCase.status} />
        </div>

        {/* Priority and suite */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={testCase.priority} />

          {testCase.suite && (
            <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              <FolderKanban size={13} className="shrink-0" />
              <span className="truncate">{testCase.suite.name}</span>
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mt-4 min-h-[40px] line-clamp-2 text-sm leading-5 text-slate-500">
          {testCase.description || "No description provided."}
        </p>

        {/* Expected result */}
        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-700">
              Expected Result
            </p>
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">
            {testCase.expectedResult}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-4 mt-5">
          <button
            type="button"
            onClick={onOpen}
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-[0.98]"
          >
            Open Test Case
            <ArrowUpRight size={15} />
          </button>

          <button
            type="button"
            onClick={onEdit}
            title="Edit test case"
            aria-label="Edit test case"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Delete test case"
            aria-label="Delete test case"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
