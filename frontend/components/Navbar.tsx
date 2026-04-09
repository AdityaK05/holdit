"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { getUser, isAuthenticated, logout } from "@/lib/auth";
import type { User } from "@/lib/types";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      setAuthenticated(isAuthenticated());
      setUser(getUser());
    };
    syncAuth();
    window.addEventListener("holdit-auth-changed", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("holdit-auth-changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

  const isStaff = user?.role === "store_staff";

  const navLinks = [
    { href: "/", label: "Home" },
    ...(authenticated ? [{ href: "/my-reservations", label: "Reservations" }] : []),
  ];

  // Hide the customer Navbar on manager pages
  if (pathname.startsWith("/manager")) return null;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ${
        scrolled
          ? "border-b border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.92)] shadow-2xl shadow-black/50"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-white text-black shadow-lg shadow-white/10 transition-transform duration-300 group-hover:rotate-12"
          >
            <span className="text-sm font-black">H</span>
          </div>
          <span className="text-xl font-bold tracking-[-0.03em] text-white">
            Hold<span className="text-[#737373]">It</span>
          </span>
        </Link>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.1)] p-2.5 text-[#737373] transition-colors hover:text-white md:hidden"
          onClick={toggleMenu}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <div className="relative h-4 w-5">
            <span className={`absolute left-0 h-px w-5 bg-current transition-all duration-300 ${menuOpen ? "top-2 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-2 h-px w-5 bg-current transition-opacity duration-300 ${menuOpen ? "opacity-0" : "opacity-100"}`} />
            <span className={`absolute left-0 h-px w-5 bg-current transition-all duration-300 ${menuOpen ? "top-2 -rotate-45" : "top-4"}`} />
          </div>
        </button>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-5 py-2.5 text-sm font-medium tracking-wide transition-all duration-300 ${
                  isActive(pathname, link.href) ? "text-white" : "text-[#525252] hover:text-white"
                }`}
              >
                {isActive(pathname, link.href) && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)]"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="ml-4 h-5 w-px bg-[rgba(255,255,255,0.08)]" />

          {authenticated && user ? (
            <div className="flex items-center gap-4 pl-4">
              {/* Manager Portal link for store staff */}
              {isStaff && (
                <Link href="/manager"
                  className="flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.06)] px-4 py-2 text-xs font-semibold text-white hover:bg-[rgba(255,255,255,0.1)] transition-all">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  Manager Portal
                </Link>
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-white text-xs font-bold text-black">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-[#a3a3a3]">{user.name}</span>
              </div>
              <button type="button" onClick={logout} className="rounded-full btn-ghost px-4 py-2 text-sm font-semibold">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-4">
              <Link href="/login" className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${isActive(pathname, "/login") ? "text-white" : "text-[#525252] hover:text-white"}`}>
                Login
              </Link>
              <Link href="/register" className="rounded-full btn-gradient px-5 py-2.5 text-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.98)] md:hidden"
          >
            <nav className="flex flex-col gap-1 px-6 py-5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-xl px-4 py-3.5 text-sm font-medium tracking-wide transition-all ${
                    isActive(pathname, link.href)
                      ? "bg-[rgba(255,255,255,0.05)] text-white"
                      : "text-[#525252] hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isStaff && (
                <Link href="/manager"
                  className="flex items-center gap-2 rounded-xl bg-[rgba(255,255,255,0.05)] px-4 py-3.5 text-sm font-semibold text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  Manager Portal
                </Link>
              )}
            </nav>
            <div className="flex flex-col gap-2 border-t border-[rgba(255,255,255,0.05)] px-6 py-5">
              {authenticated && user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-white text-xs font-bold text-black">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#a3a3a3]">{user.name}</span>
                  </div>
                  <button type="button" onClick={logout} className="rounded-xl btn-ghost px-4 py-3 text-sm font-semibold">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="rounded-xl px-4 py-3 text-center text-sm font-medium text-[#525252] hover:text-white transition-colors">Login</Link>
                  <Link href="/register" className="rounded-xl btn-gradient px-4 py-3 text-center text-sm">Register</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
