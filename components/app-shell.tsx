"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Sidebar from "@/components/sidebar";

const publicRoutes = new Set(["/auth/login", "/auth/register"]);

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (publicRoutes.has(pathname)) {
    return children;
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
