"use client";

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
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{suite.name}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {suite._count?.testCases ?? 0} cases
        </span>
      </div>
      <p className="mt-3 min-h-10 text-sm text-slate-600">
        {suite.description || "No description provided."}
      </p>
      <p className="mt-4 text-xs text-slate-500">
        Created {new Date(suite.createdAt).toLocaleDateString()}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <button
          type="button"
          onClick={onOpen}
          className="min-h-10 flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Open Suite
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="min-h-10 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
