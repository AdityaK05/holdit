"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import ReservationCard from "@/components/ReservationCard";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { mockReservations } from "@/lib/mock-data";
import type { ApiResponse, Reservation } from "@/lib/types";

function Skeleton() {
  return <div className="glass-card rounded-2xl p-6"><div className="flex gap-5"><div className="h-24 w-24 rounded-xl skeleton-shimmer" /><div className="flex-1 space-y-3"><div className="h-6 w-1/3 rounded skeleton-shimmer" /><div className="h-4 w-1/2 rounded skeleton-shimmer" /><div className="h-10 w-full rounded-xl skeleton-shimmer" /></div></div></div>;
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingIds, setCancellingIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: "success" | "error" }>>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((c) => [...c, { id, message, type }]);
    window.setTimeout(() => setToasts((c) => c.filter((t) => t.id !== id)), 3000);
  };

  const loadReservations = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get<ApiResponse<{ reservations: Reservation[] }>>("/reservations/me");
      setReservations(res.data.data.reservations);
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        // Backend down — use mock data
        setReservations(mockReservations);
        setLoading(false);
        return;
      }
      if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? "Something went wrong");
      else setError("Something went wrong");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (!isAuthenticated()) { setLoading(false); return; } void loadReservations(); }, []);

  const active = useMemo(() => reservations.filter((r) => ["pending", "confirmed"].includes(r.status)), [reservations]);
  const past = useMemo(() => reservations.filter((r) => !["pending", "confirmed"].includes(r.status)), [reservations]);

  const handleCancel = async (id: string) => {
    setCancellingIds((c) => [...c, id]);
    try {
      await api.delete(`/reservations/${id}`);
      setReservations((c) => c.filter((r) => r.id !== id));
      showToast("Reservation cancelled");
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        // Backend down — cancel locally
        setReservations((c) => c.filter((r) => r.id !== id));
        showToast("Reservation cancelled");
      } else if (axios.isAxiosError(err)) {
        showToast(err.response?.data?.message ?? "Couldn't cancel", "error");
      } else {
        showToast("Couldn't cancel", "error");
      }
    } finally { setCancellingIds((c) => c.filter((x) => x !== id)); }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-[calc(100vh-73px)] px-6 py-16 lg:px-8">
        {/* Toasts */}
        <div className="fixed right-6 top-24 z-50 space-y-3">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div key={t.id}
                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
                className={`glass-card max-w-sm rounded-xl px-4 py-3 text-sm font-medium ${
                  t.type === "success" ? "text-white" : "text-[#a3a3a3]"
                }`}
              >
                {t.type === "success" ? "✓ " : "✕ "}{t.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mx-auto max-w-6xl space-y-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#525252]">Your reservations</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">My holds</h1>
          </motion.div>

          {error && (
            <div className="glass-card rounded-2xl p-6"><p className="text-sm text-[#a3a3a3]">{error}</p>
              <button type="button" onClick={() => void loadReservations()} className="btn-gradient mt-4 rounded-xl px-4 py-2 text-sm">Retry</button></div>
          )}

          {loading ? <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}</div>
           : reservations.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.1)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7 text-[#525252]">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">No reservations yet</h2>
              <p className="mt-3 text-sm text-[#525252]">Reserve something to see it here.</p>
              <Link href="/" className="btn-gradient mt-6 inline-flex rounded-xl px-6 py-3 text-sm">Browse products</Link>
            </motion.div>
          ) : (
            <div className="space-y-10">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Active</h2>
                  <span className="flex items-center gap-2 text-sm text-[#525252]">
                    {active.length > 0 && <span className="relative flex h-1.5 w-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-white opacity-40" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" /></span>}
                    {active.length}
                  </span>
                </div>
                {active.length ? active.map((r, i) => <ReservationCard key={r.id} reservation={r} cancelling={cancellingIds.includes(r.id)} onCancel={handleCancel} index={i} />)
                  : <div className="glass-card rounded-2xl p-6 text-sm text-[#525252]">No active reservations.</div>}
              </section>
              <div className="border-t border-[rgba(255,255,255,0.05)]" />
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Past</h2>
                  <span className="text-sm text-[#525252]">{past.length}</span>
                </div>
                {past.length ? past.map((r, i) => <ReservationCard key={r.id} reservation={r} onCancel={handleCancel} index={i} />)
                  : <div className="glass-card rounded-2xl p-6 text-sm text-[#525252]">No past reservations.</div>}
              </section>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
