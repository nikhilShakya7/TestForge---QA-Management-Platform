import Sidebar from "@/components/sidebar";

export default function DefectsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <Sidebar />

      <section className="min-w-0 flex-1 p-5 md:p-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-2">Defects</h2>
          <p className="text-sm text-slate-500">
            Defect management will be built in Phase E. This page is a
            placeholder so navigation stays working.
          </p>
        </div>
      </section>
    </main>
  );
}
