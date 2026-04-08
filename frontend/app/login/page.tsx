"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(""); setLoading(true);
    try {
      const { user } = await login(email, password);
      router.push(user.role === "store_staff" ? "/dashboard" : "/");
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? "Unable to login");
      else setError("Unable to login");
    } finally { setLoading(false); }
  };

  return (
    <main className="relative flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-16">
      {/* Grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md glass-card rounded-2xl p-8"
      >
        <div className="mb-10 space-y-3 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-[#525252]"
          >Welcome back</motion.p>
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl font-bold tracking-[-0.03em] text-white"
            >Sign in</motion.h1>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
            <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Email</label>
            <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" className="glass-input w-full rounded-xl px-4 py-3.5 text-sm" required />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-2">
            <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Password</label>
            <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" className="glass-input w-full rounded-xl px-4 py-3.5 text-sm" required />
          </motion.div>

          {error && (
            <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="text-sm font-medium text-[#a3a3a3]">{error}</motion.p>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <button type="submit" disabled={loading}
              className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm">
              {loading ? <><span className="spinner-orbital-sm" /> Logging in...</> : "Login"}
            </button>
          </motion.div>
        </form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="mt-8 text-center text-sm text-[#525252]">
          New here?{" "}
          <Link href="/register" className="font-semibold text-white hover:underline transition-all">Create an account</Link>
        </motion.p>
      </motion.div>
    </main>
  );
}
