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

function DashboardLayoutContent({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "pending";
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const syncUser = () => setUser(getUser());
    syncUser();
    window.addEventListener("holdit-auth-changed", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("holdit-auth-changed", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  return (
    <ProtectedRoute requiredRole="store_staff">
      <div className="min-h-[calc(100vh-73px)] bg-slate-50">
        <div className="mx-auto flex max-w-7xl">
          <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-72 shrink-0 border-r border-slate-200 bg-white px-6 py-8 lg:flex lg:flex-col">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
                HoldIt Staff
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950">Store dashboard</h2>
            </div>

            <nav className="mt-10 space-y-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.key}
                  href={`/dashboard?tab=${tab.key}`}
                  className={`flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{user?.name ?? "Store Staff"}</p>
              <p className="mt-1 text-xs text-slate-500">{user?.email ?? ""}</p>
              <button
                type="button"
                onClick={logout}
                className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </aside>

          <div className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</div>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white lg:hidden">
          <div className="grid grid-cols-3 gap-1 p-2">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={`/dashboard?tab=${tab.key}`}
                className={`rounded-2xl px-3 py-3 text-center text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  );
}

function DashboardLayoutFallback({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="store_staff">
      <div className="min-h-[calc(100vh-73px)] bg-slate-50">
        <div className="mx-auto flex max-w-7xl">
          <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-72 shrink-0 border-r border-slate-200 bg-white px-6 py-8 lg:flex lg:flex-col">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
                HoldIt Staff
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950">Store dashboard</h2>
            </div>
          </aside>
          <div className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Suspense fallback={<DashboardLayoutFallback>{children}</DashboardLayoutFallback>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
