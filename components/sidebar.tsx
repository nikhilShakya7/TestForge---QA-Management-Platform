"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  ClipboardList,
  PlayCircle,
  Bug,
  Settings,
  LogOut,
  ChevronRight,
  FlaskConical,
  Users,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{
    email: string | null;
    name: string | null;
    role: string | null;
  } | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (active) {
          if (res.ok) {
            const data = await res.json();
            if (active) setUser(data.user);
          } else if (res.status !== 401) {
            console.error("Failed to load current user:", res.status);
          }
        }
      } catch (error) {
        console.error("Failed to load current user:", error);
      } finally {
        if (active) setUserLoading(false);
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("")
    : user?.email?.charAt(0).toUpperCase() || "U";

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setUser(null);
      router.push("/auth/login");
      setLoggingOut(false);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Test Suites", href: "/test-suites", icon: Layers },
    { name: "Test Cases", href: "/test-cases", icon: ClipboardList },
    { name: "Test Runs", href: "/test-runs", icon: PlayCircle },
    { name: "Defects", href: "/defects", icon: Bug },
    ...(user?.role === "SUPER_ADMIN"
      ? [{ name: "User Management", href: "/user-management", icon: Users }]
      : []),
  ];

  return (
    <aside className="flex w-full flex-col border-b border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-hidden md:border-b-0 md:border-r">
      <div className="shrink-0 border-b border-slate-100 px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <FlaskConical size={21} strokeWidth={2.2} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              TestForge
            </h1>
            <p className="text-xs font-medium text-slate-500">
              QA Management Platform
            </p>
          </div>
        </Link>
      </div>

      <nav aria-label="Main navigation" className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Workspace
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {active && (
                  <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-indigo-600" />
                )}

                <Icon
                  size={18}
                  strokeWidth={active ? 2.3 : 1.8}
                  className={
                    active
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }
                />

                <span className="flex-1">{item.name}</span>

                {active && (
                  <ChevronRight size={15} className="text-indigo-500" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-8">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Preferences
          </p>

          <Link
            href="/settings"
            aria-current={isActive("/settings") ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              isActive("/settings")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Settings
              size={18}
              className={
                isActive("/settings")
                  ? "text-indigo-600"
                  : "text-slate-400 group-hover:text-slate-600"
              }
            />
            <span>Settings</span>
          </Link>
        </div>

      </nav>

      <footer className="mt-auto shrink-0 border-t border-slate-100 p-4">
        {userLoading ? (
          <div aria-label="Loading user information" className="animate-pulse space-y-3">
            <div className="h-4 w-2/3 rounded bg-slate-100" />
            <div className="h-9 rounded-lg bg-slate-100" />
          </div>
        ) : user ? (
          <>
            <div className="mb-4 flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.name || "User"}
                </p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut size={17} />
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">You are not signed in.</p>
            <Link
              href="/auth/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Sign in
              <ChevronRight size={16} />
            </Link>
          </>
        )}

        <p className="mt-4 text-center text-[10px] font-medium tracking-wide text-slate-400">
          TESTFORGE · QA WORKSPACE
        </p>
      </footer>
    </aside>
  );
}
