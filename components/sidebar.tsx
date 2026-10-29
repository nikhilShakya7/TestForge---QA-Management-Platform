"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Test Cases", href: "/test-cases" },
  { name: "Test Runs", href: "/test-runs" },
  { name: "Defects", href: "/defects" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-slate-200 bg-white p-6 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <h1 className="text-2xl font-bold text-indigo-600">TestForge</h1>
      <p className="mt-1 text-sm text-slate-500">QA Management Platform</p>

      <nav className="mt-8 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-semibold">Project status</p>
        <p className="mt-1 text-xs text-slate-500">
          Your testing workspace is ready.
        </p>
      </div>
    </aside>
  );
}
