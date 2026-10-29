import Sidebar from "@/components/sidebar";

const stats = [
  { label: "Total Tests", value: 128, detail: "Across all test suites" },
  { label: "Passed", value: 105, detail: "Tests successful" },
  { label: "Failed", value: 15, detail: "Needs investigation" },
  { label: "Blocked", value: 8, detail: "Waiting for resolution" },
];

const testRuns = [
  {
    name: "Login Tests",
    date: "Today, 9:30 AM",
    passed: 18,
    failed: 2,
    status: "Failed",
  },
  {
    name: "Checkout Tests",
    date: "Today, 9:10 AM",
    passed: 24,
    failed: 0,
    status: "Passed",
  },
  {
    name: "Registration Tests",
    date: "Yesterday, 4:20 PM",
    passed: 15,
    failed: 1,
    status: "Failed",
  },
  {
    name: "Product Tests",
    date: "Yesterday, 3:45 PM",
    passed: 20,
    failed: 0,
    status: "Passed",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <Sidebar />

      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor your software testing activity.
            </p>
          </div>

          <button className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
            + New Test Run
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-3 text-3xl font-bold">{stat.value}</p>
              <p className="mt-2 text-xs text-slate-500">{stat.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-6 xl:col-span-1">
            <h3 className="font-semibold">Execution Overview</h3>
            <p className="mt-1 text-sm text-slate-500">Current test results</p>

            <p className="mt-6 text-4xl font-bold">82%</p>
            <p className="mt-1 text-sm text-slate-500">Pass rate</p>

            <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="w-[82%] bg-emerald-500" />
              <div className="w-[12%] bg-red-500" />
              <div className="w-[6%] bg-amber-400" />
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <p className="flex justify-between">
                <span>Passed</span>
                <span className="font-medium">82%</span>
              </p>
              <p className="flex justify-between">
                <span>Failed</span>
                <span className="font-medium">12%</span>
              </p>
              <p className="flex justify-between">
                <span>Blocked</span>
                <span className="font-medium">6%</span>
              </p>
            </div>
          </article>

          <article className="overflow-hidden rounded-xl border border-slate-200 bg-white xl:col-span-2">
            <div className="border-b border-slate-200 p-6">
              <h3 className="font-semibold">Recent Test Runs</h3>
              <p className="mt-1 text-sm text-slate-500">
                Latest test execution activity
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Test Suite</th>
                    <th className="px-5 py-3 font-medium">Passed</th>
                    <th className="px-5 py-3 font-medium">Failed</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {testRuns.map((run) => (
                    <tr key={run.name} className="border-t border-slate-100">
                      <td className="px-5 py-4">
                        <p className="font-medium">{run.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {run.date}
                        </p>
                      </td>
                      <td className="px-5 py-4">{run.passed}</td>
                      <td className="px-5 py-4">{run.failed}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            run.status === "Passed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          TestForge · QA Management Platform
        </p>
      </section>
    </main>
  );
}
