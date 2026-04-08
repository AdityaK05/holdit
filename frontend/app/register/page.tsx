"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { register } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) return "All fields are required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  };

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const err = validate(); if (err) { setError(err); return; }
    setError(""); setLoading(true);
    try { await register(name, phone, email, password); router.push("/"); }
    catch (e) { if (axios.isAxiosError(e)) setError(e.response?.data?.message ?? "Unable to register"); else setError("Unable to register"); }
    finally { setLoading(false); }
  };

  const fields = [
    { id: "reg-name", label: "Full Name", type: "text", value: name, set: setName, placeholder: "Aarav Sharma", full: true },
    { id: "reg-phone", label: "Phone", type: "tel", value: phone, set: setPhone, placeholder: "+91 98765 43210" },
    { id: "reg-email", label: "Email", type: "email", value: email, set: setEmail, placeholder: "you@example.com" },
    { id: "reg-password", label: "Password", type: "password", value: password, set: setPassword, placeholder: "Create a password" },
    { id: "reg-confirm-password", label: "Confirm Password", type: "password", value: confirmPassword, set: setConfirmPassword, placeholder: "Re-enter password" },
  ];

  return (
    <main className="relative flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-lg glass-card rounded-2xl p-8"
      >
        <div className="mb-10 space-y-3 text-center">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-[#525252]">Join HoldIt</motion.p>
          <div className="overflow-hidden">
            <motion.h1 initial={{ y: 50 }} animate={{ y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl font-bold tracking-[-0.03em] text-white">Create account</motion.h1>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className={`space-y-2 ${f.full ? "sm:col-span-2" : ""}`}
              >
                <label htmlFor={f.id} className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">{f.label}</label>
                <input id={f.id} type={f.type} value={f.value} onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder} className="glass-input w-full rounded-xl px-4 py-3.5 text-sm" required />
                {f.id === "reg-password" && password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((l) => (
                        <div key={l} className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${l <= strength ? "bg-white" : "bg-[rgba(255,255,255,0.08)]"}`} />
                      ))}
                    </div>
                    <p className="text-[11px] text-[#525252]">
                      {strength === 1 ? "Weak" : strength === 2 ? "Good" : "Strong"}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {error && (
            <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="text-sm font-medium text-[#a3a3a3]">{error}</motion.p>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <button type="submit" disabled={loading}
              className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm">
              {loading ? <><span className="spinner-orbital-sm" /> Creating...</> : "Register"}
            </button>
          </motion.div>
        </form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-8 text-center text-sm text-[#525252]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-white hover:underline transition-all">Login</Link>
        </motion.p>
      </motion.div>
    </main>
  );
}
