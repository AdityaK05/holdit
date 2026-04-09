"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getUser, logout } from "@/lib/auth";
import type { User } from "@/lib/types";

const navItems = [
  {
    href: "/manager",
    label: "Overview",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/manager/reservations",
    label: "Reservations",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" /><path d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/manager/inventory",
    label: "Inventory",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
      </svg>
    ),
  },
  {
    href: "/manager/store",
    label: "Store Profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
      </svg>
    ),
  },
  {
    href: "/manager/settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string) {
  return href === "/manager" ? pathname === "/manager" : pathname.startsWith(href);
}

export default function ManagerSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
    const sync = () => setUser(getUser());
    window.addEventListener("holdit-auth-changed", sync);
    return () => window.removeEventListener("holdit-auth-changed", sync);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);

  const sidebarContent = (
    <>
      {/* Store brand */}
      <div className={`flex items-center gap-3 px-5 py-6 ${collapsed ? "justify-center px-3" : ""}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.15)] bg-white text-black">
          <span className="text-sm font-black">H</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">TechHub Electronics</p>
            <p className="text-[11px] text-[#525252]">Store Manager</p>
          </div>
        )}
      </div>

      <div className="mx-4 border-t border-[rgba(255,255,255,0.06)]" />

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-[rgba(255,255,255,0.08)] text-white"
                  : "text-[#525252] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#a3a3a3]"
              } ${collapsed ? "justify-center" : ""}`}
            >
              {/* Active indicator bar */}
              {active && (
                <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
              )}
              <span className={active ? "text-white" : "text-[#525252] group-hover:text-[#a3a3a3]"}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="mx-4 border-t border-[rgba(255,255,255,0.06)]" />
      <div className={`flex items-center gap-3 px-5 py-5 ${collapsed ? "justify-center px-3" : ""}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-white text-xs font-bold text-black">
          {user?.name?.charAt(0)?.toUpperCase() ?? "M"}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name ?? "Manager"}</p>
            <button type="button" onClick={logout} className="text-xs text-[#525252] hover:text-white transition-colors">
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Collapse button (desktop) */}
      <div className="hidden px-3 pb-4 lg:block">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center justify-center rounded-xl border border-[rgba(255,255,255,0.06)] py-2 text-[#525252] hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>
            <path d="m11 17-5-5 5-5" /><path d="m18 17-5-5 5-5" />
          </svg>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={toggleMobile}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.9)] text-[#737373] lg:hidden"
        aria-label="Toggle sidebar"
      >
        <div className="relative h-4 w-5">
          <span className={`absolute left-0 h-px w-5 bg-current transition-all duration-300 ${mobileOpen ? "top-2 rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 top-2 h-px w-5 bg-current transition-opacity duration-300 ${mobileOpen ? "opacity-0" : "opacity-100"}`} />
          <span className={`absolute left-0 h-px w-5 bg-current transition-all duration-300 ${mobileOpen ? "top-2 -rotate-45" : "top-4"}`} />
        </div>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={toggleMobile} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,5,0.98)] transition-all duration-300 lg:sticky lg:translate-x-0 ${
          collapsed ? "lg:w-[72px]" : "lg:w-[260px]"
        } ${mobileOpen ? "w-[260px] translate-x-0" : "-translate-x-full"}`}
      >
        {sidebarContent}
      </aside>

      {/* Customer link */}
      <Link
        href="/"
        className="fixed bottom-6 right-6 z-30 hidden items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.9)] px-4 py-2.5 text-xs font-semibold text-[#525252] hover:text-white transition-all hover:border-[rgba(255,255,255,0.2)] lg:inline-flex"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Customer View
      </Link>
    </>
  );
}
