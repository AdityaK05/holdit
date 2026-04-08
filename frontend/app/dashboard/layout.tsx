"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import type { User } from "@/lib/types";
import { getUser, logout } from "@/lib/auth";

const tabs = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
];

function DashboardLayoutContent({ children }: Readonly<{ children: ReactNode }>) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "pending";
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sync = () => setUser(getUser());
    sync();
    window.addEventListener("holdit-auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("holdit-auth-changed", sync); window.removeEventListener("storage", sync); };
  }, []);

  return (
    <ProtectedRoute requiredRole="store_staff">
      <div className="min-h-[calc(100vh-73px)]">
        <div className="mx-auto flex max-w-7xl">
          <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-64 shrink-0 border-r border-[rgba(255,255,255,0.05)] px-6 py-10 lg:flex lg:flex-col">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#525252]">Staff</p>
              <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-white">Dashboard</h2>
            </div>
            <nav className="mt-10 space-y-1">
              {tabs.map((tab) => (
                <Link key={tab.key} href={`/dashboard?tab=${tab.key}`}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all ${
                    activeTab === tab.key ? "bg-white text-black" : "text-[#525252] hover:bg-[rgba(255,255,255,0.03)] hover:text-white"
                  }`}>{tab.label}</Link>
              ))}
            </nav>
            <div className="mt-auto glass-card rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-white text-sm font-bold text-black">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "S"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user?.name ?? "Staff"}</p>
                  <p className="truncate text-xs text-[#3a3a3a]">{user?.email ?? ""}</p>
                </div>
              </div>
              <button type="button" onClick={logout} className="btn-ghost mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold">Logout</button>
            </div>
          </aside>
          <div className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</div>
        </div>
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.95)] backdrop-blur-2xl lg:hidden">
          <div className="grid grid-cols-3 gap-1 p-2">
            {tabs.map((tab) => (
              <Link key={tab.key} href={`/dashboard?tab=${tab.key}`}
                className={`flex items-center justify-center rounded-xl px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === tab.key ? "bg-white text-black" : "text-[#3a3a3a]"
                }`}>{tab.label}</Link>
            ))}
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  );
}

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Suspense fallback={
      <ProtectedRoute requiredRole="store_staff">
        <div className="min-h-[calc(100vh-73px)]"><div className="mx-auto flex max-w-7xl">
          <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-64 shrink-0 border-r border-[rgba(255,255,255,0.05)] px-6 py-10 lg:flex lg:flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#525252]">Staff</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Dashboard</h2>
          </aside>
          <div className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</div>
        </div></div>
      </ProtectedRoute>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
