"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { login, loginAsMockStaff } from "@/lib/auth";

type RoleChoice = null | "customer" | "store_staff";

function RoleCard({ selected, onClick, icon, title, description }: {
  selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; description: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`group relative flex flex-col items-center gap-4 rounded-2xl border p-8 text-center transition-all duration-500 ${
        selected
          ? "border-white bg-[rgba(255,255,255,0.08)] shadow-[0_0_40px_rgba(255,255,255,0.06)]"
          : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.04)]"
      }`}
    >
      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-500 ${
        selected
          ? "border-white bg-white text-black"
          : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[#525252] group-hover:text-[#a3a3a3]"
      }`}>
        {icon}
      </div>
      <div>
        <h3 className={`text-lg font-bold transition-colors duration-300 ${selected ? "text-white" : "text-[#a3a3a3]"}`}>{title}</h3>
        <p className={`mt-1 text-sm transition-colors duration-300 ${selected ? "text-[#a3a3a3]" : "text-[#3a3a3a]"}`}>{description}</p>
      </div>
      {/* Selection indicator */}
      <div className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 ${
        selected ? "border-white bg-white" : "border-[rgba(255,255,255,0.15)]"
      }`}>
        {selected && (
          <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" className="h-3.5 w-3.5">
            <path d="m5 13 4 4L19 7" />
          </motion.svg>
        )}
      </div>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [roleChoice, setRoleChoice] = useState<RoleChoice>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roleChoice) { setError("Please select your role above"); return; }
    setError(""); setLoading(true);
    try {
      if (roleChoice === "store_staff") {
        loginAsMockStaff();
        router.push("/manager");
      } else {
        const { user } = await login(email, password);
        router.push(user.role === "store_staff" ? "/manager" : "/");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? "Unable to login");
      else setError("Unable to login");
    } finally { setLoading(false); }
  };

  const handleQuickLogin = () => {
    if (roleChoice === "store_staff") {
      loginAsMockStaff();
      router.push("/manager");
    } else {
      // Quick customer login
      setEmail("demo@holdit.app");
      setPassword("demo1234");
    }
  };

  return (
    <main className="relative flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-16">
      {/* Grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-xl"
      >
        <div className="mb-10 space-y-3 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-[#525252]"
          >Welcome to HoldIt</motion.p>
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl font-bold tracking-[-0.03em] text-white"
            >Choose your role</motion.h1>
          </div>
        </div>

        {/* Role selection cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <RoleCard
            selected={roleChoice === "customer"}
            onClick={() => setRoleChoice("customer")}
            title="Customer"
            description="Browse products, reserve items, pick up in store"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <RoleCard
            selected={roleChoice === "store_staff"}
            onClick={() => setRoleChoice("store_staff")}
            title="Store Manager"
            description="Manage inventory, handle reservations, run your store"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                <path d="M2 7h20" />
              </svg>
            }
          />
        </motion.div>

        {/* Login form (appears after role selection) */}
        <AnimatePresence mode="wait">
          {roleChoice && (
            <motion.div
              key={roleChoice}
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mt-8 overflow-hidden"
            >
              <div className="glass-card rounded-2xl p-8">
                {roleChoice === "store_staff" ? (
                  /* Store Manager — one-click demo login */
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.15)] bg-white text-black">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-white">Store Manager Portal</h2>
                      <p className="mt-2 text-sm leading-relaxed text-[#525252]">
                        Access the full store management dashboard with analytics, inventory tracking, reservation management, and store settings.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        {[
                          { label: "Inventory", icon: "📦" },
                          { label: "Reservations", icon: "📋" },
                          { label: "Analytics", icon: "📊" },
                          { label: "Settings", icon: "⚙️" },
                        ].map((f) => (
                          <div key={f.label} className="rounded-lg bg-[rgba(255,255,255,0.03)] px-3 py-2.5">
                            <span className="text-lg">{f.icon}</span>
                            <p className="mt-1 text-[11px] font-semibold text-[#525252]">{f.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button type="button" onClick={() => { loginAsMockStaff(); router.push("/manager"); }}
                      className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      Enter Manager Portal
                    </button>
                  </div>
                ) : (
                  /* Customer — email/password form */
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Email</label>
                      <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com" className="glass-input w-full rounded-xl px-4 py-3.5 text-sm" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Password</label>
                      <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password" className="glass-input w-full rounded-xl px-4 py-3.5 text-sm" required />
                    </div>

                    {error && (
                      <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="text-sm font-medium text-[#a3a3a3]">{error}</motion.p>
                    )}

                    <button type="submit" disabled={loading}
                      className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm">
                      {loading ? <><span className="spinner-orbital-sm" /> Logging in...</> : "Login as Customer"}
                    </button>

                    <p className="text-center text-sm text-[#525252]">
                      New here?{" "}
                      <Link href="/register" className="font-semibold text-white hover:underline transition-all">Create an account</Link>
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
