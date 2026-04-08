"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import DashboardReservationCard from "@/components/DashboardReservationCard";
import api from "@/lib/api";
import type { ApiResponse, DashboardReservation } from "@/lib/types";

type DashboardTab = "pending" | "confirmed" | "completed";
type LoadingAction = { reservationId: string; action: "confirm" | "reject" | "complete" } | null;

const tabLabels: Record<DashboardTab, string> = { pending: "Pending", confirmed: "Confirmed", completed: "Completed" };

function DashboardSkeleton() {
  return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="glass-card rounded-2xl p-6"><div className="flex gap-5"><div className="h-24 w-24 rounded-xl skeleton-shimmer" /><div className="flex-1 space-y-3"><div className="h-6 w-1/3 rounded skeleton-shimmer" /><div className="h-4 w-1/2 rounded skeleton-shimmer" /><div className="h-12 w-full rounded-xl skeleton-shimmer" /></div></div></div>
  ))}</div>;
}

function ErrorToast({ messages }: { messages: Array<{ id: number; message: string }> }) {
  return (
    <div className="fixed right-6 top-24 z-50 space-y-3">
      <AnimatePresence>
        {messages.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            className="glass-card max-w-sm rounded-xl px-4 py-3 text-sm font-medium text-[#a3a3a3]">{t.message}</motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: DashboardTab = rawTab === "confirmed" || rawTab === "completed" ? rawTab : "pending";
  const [reservationsByTab, setReservationsByTab] = useState<Record<DashboardTab, DashboardReservation[]>>({ pending: [], confirmed: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([]);

  const showToast = (msg: string) => { const id = Date.now() + Math.random(); setToasts((c) => [...c, { id, message: msg }]); window.setTimeout(() => setToasts((c) => c.filter((t) => t.id !== id)), 3000); };

  const fetchReservations = async (tab: DashboardTab, preserveLoading = false) => {
    if (!preserveLoading) setLoading(true);
    try {
      const [tabRes, pendingRes] = await Promise.all([
        api.get<ApiResponse<{ reservations: DashboardReservation[] }>>(`/dashboard/reservations?status=${tab}`),
        api.get<ApiResponse<{ reservations: DashboardReservation[] }>>("/dashboard/reservations?status=pending"),
      ]);
      setReservationsByTab((c) => ({ ...c, [tab]: tabRes.data.data.reservations, pending: tab === "pending" ? tabRes.data.data.reservations : pendingRes.data.data.reservations }));
      setPendingCount(pendingRes.data.data.reservations.length);
    } catch (err) { if (axios.isAxiosError(err)) showToast(err.response?.data?.message ?? "Error"); else showToast("Error"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void fetchReservations(activeTab);
    const interval = window.setInterval(() => void fetchReservations(activeTab, true), 15000);
    return () => window.clearInterval(interval);
  }, [activeTab]);

  const currentReservations = useMemo(() => reservationsByTab[activeTab] ?? [], [activeTab, reservationsByTab]);

  const moveReservation = (r: DashboardReservation, target: DashboardTab | null) => {
    setReservationsByTab((c) => {
      const next = { pending: c.pending.filter((x) => x.id !== r.id), confirmed: c.confirmed.filter((x) => x.id !== r.id), completed: c.completed.filter((x) => x.id !== r.id) };
      if (target) next[target] = [r, ...next[target]];
      return next;
    });
  };

  const handleConfirm = async (id: string) => {
    setLoadingAction({ reservationId: id, action: "confirm" });
    try { const res = await api.post<ApiResponse<{ reservation: DashboardReservation }>>(`/dashboard/reservations/${id}/confirm`, {}); moveReservation(res.data.data.reservation, "confirmed"); setPendingCount((c) => Math.max(c - 1, 0)); }
    catch (err) { if (axios.isAxiosError(err)) showToast(err.response?.data?.message ?? "Error"); else showToast("Error"); }
    finally { setLoadingAction(null); }
  };

  const handleReject = async (id: string) => {
    setLoadingAction({ reservationId: id, action: "reject" });
    try { const res = await api.post<ApiResponse<{ reservation: DashboardReservation }>>(`/dashboard/reservations/${id}/reject`, {}); moveReservation(res.data.data.reservation, null); setPendingCount((c) => Math.max(c - 1, 0)); }
    catch (err) { if (axios.isAxiosError(err)) showToast(err.response?.data?.message ?? "Error"); else showToast("Error"); }
    finally { setLoadingAction(null); }
  };

  const handleComplete = async (id: string, otp: string) => {
    setLoadingAction({ reservationId: id, action: "complete" });
    try { const res = await api.post<ApiResponse<{ reservation: DashboardReservation }>>(`/dashboard/reservations/${id}/complete`, { otp }); moveReservation(res.data.data.reservation, "completed"); }
    catch (err) { if (axios.isAxiosError(err)) showToast(err.response?.data?.message ?? "Error"); else showToast("Error"); }
    finally { setLoadingAction(null); }
  };

  return (
    <main className="px-6 py-10 lg:px-10">
      <ErrorToast messages={toasts} />
      <div className="mx-auto max-w-5xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#525252]">Dashboard</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white">{tabLabels[activeTab]}</h1>
        </motion.div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(tabLabels) as DashboardTab[]).map((tab) => (
            <button key={tab} type="button" onClick={() => router.push(`/dashboard?tab=${tab}`)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide transition-all ${
                activeTab === tab ? "bg-white text-black" : "glass-card text-[#525252] hover:text-white"
              }`}>
              {tabLabels[tab]}
              {tab === "pending" && pendingCount > 0 && (
                <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  activeTab === tab ? "bg-black text-white" : "bg-[rgba(255,255,255,0.1)] text-white"
                }`}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? <DashboardSkeleton /> : currentReservations.length ? (
          <div className="space-y-4">{currentReservations.map((r, i) => (
            <DashboardReservationCard key={r.id} reservation={r} onConfirm={handleConfirm} onReject={handleReject} onComplete={handleComplete}
              loadingAction={loadingAction?.reservationId === r.id ? loadingAction.action : null} index={i} />
          ))}</div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-16 text-center">
            <h2 className="text-xl font-bold text-white">No {activeTab} reservations</h2>
            <p className="mt-2 text-sm text-[#525252]">New reservations will appear here.</p>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return <Suspense fallback={<main className="px-6 py-10 lg:px-10"><div className="mx-auto max-w-5xl"><DashboardSkeleton /></div></main>}><DashboardPageContent /></Suspense>;
}
