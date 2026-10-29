import Sidebar from "@/components/sidebar";

const testCases = [
  {
    id: "TC-001",
    title: "User login with valid credentials",
    priority: "High",
    status: "Passed",
  },
  {
    id: "TC-002",
    title: "User login with invalid password",
    priority: "High",
    status: "Passed",
  },
  {
    id: "TC-003",
    title: "Password reset flow",
    priority: "Medium",
    status: "Draft",
  },
  {
    id: "TC-004",
    title: "Checkout page validation",
    priority: "Critical",
    status: "Failed",
  },
  {
    id: "TC-005",
    title: "User registration with duplicate email",
    priority: "Medium",
    status: "Draft",
  },
];

export default function TestCasesPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <Sidebar />

      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Test Cases</h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage your test cases.
            </p>
          </div>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {testCases.map((tc) => (
                <tr
                  key={tc.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {tc.id}
                  </td>
                  <td className="px-5 py-4">{tc.title}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tc.priority === "Critical"
                        ? "bg-red-50 text-red-700"
                        : tc.priority === "High"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-slate-50 text-slate-700"
                    }`}>
                      {tc.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tc.status === "Passed"
                        ? "bg-emerald-50 text-emerald-700"
                        : tc.status === "Failed"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {tc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          TestForge · QA Management Platform
        </p>
      </section>
    </main>
  );
}
