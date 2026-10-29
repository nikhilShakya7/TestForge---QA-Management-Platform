"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const [user, setUser] = useState<{ email: string | null; name: string | null } | null>(null);

  // Fetch current user from session
  async function loadUser() {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // Session not available yet
    }
  }

  // Load on mount
  if (typeof window !== "undefined") {
    loadUser();
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore errors
    }
    setUser(null);
    router.push("/auth/login");
  }

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

      {user ? (
        <div className="mt-8 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-medium">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {user.name || user.email}
              </p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="mt-8 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4">
            You are not signed in.
          </p>
          <Link
            href="/auth/login"
            className="w-full block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-center text-white hover:bg-indigo-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
      )}

      <div className="mt-8 rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-semibold">Project status</p>
        <p className="mt-1 text-xs text-slate-500">
          Your testing workspace is ready.
        </p>
      </div>
    </aside>
  );
}
