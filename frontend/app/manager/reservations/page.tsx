"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import DashboardReservationCard from "@/components/DashboardReservationCard";
import { getMockDashboardReservations } from "@/lib/mock-data";
import api from "@/lib/api";
import type { ApiResponse, DashboardReservation } from "@/lib/types";

type Tab = "pending" | "confirmed" | "completed";
type LoadingAction = { reservationId: string; action: "confirm" | "reject" | "complete" } | null;

const tabs: { key: Tab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
];

function Skeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-6">
          <div className="flex gap-5">
            <div className="h-24 w-24 rounded-xl skeleton-shimmer" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-1/3 rounded skeleton-shimmer" />
              <div className="h-4 w-1/2 rounded skeleton-shimmer" />
              <div className="h-12 w-full rounded-xl skeleton-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ToastContainer({ messages }: { messages: Array<{ id: number; message: string; type: "success" | "error" }> }) {
  return (
    <div className="fixed right-6 top-24 z-50 space-y-3">
      <AnimatePresence>
        {messages.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`glass-card max-w-sm rounded-xl px-4 py-3 text-sm font-medium ${
              t.type === "success" ? "text-white" : "text-[#a3a3a3]"
            }`}
          >
            {t.type === "success" ? "✓ " : "✕ "}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function ManagerReservationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [allReservations, setAllReservations] = useState<DashboardReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: "success" | "error" }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((c) => [...c, { id, message, type }]);
    window.setTimeout(() => setToasts((c) => c.filter((t) => t.id !== id)), 3000);
  }, []);

  const loadReservations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Fetch all three statuses in parallel so tab switching is instant
      const [pendingRes, confirmedRes, completedRes] = await Promise.all([
        api.get<ApiResponse<{ reservations: DashboardReservation[] }>>("/dashboard/reservations?status=pending"),
        api.get<ApiResponse<{ reservations: DashboardReservation[] }>>("/dashboard/reservations?status=confirmed"),
        api.get<ApiResponse<{ reservations: DashboardReservation[] }>>("/dashboard/reservations?status=completed"),
      ]);
      const res = {
        data: {
          data: {
            reservations: [
              ...pendingRes.data.data.reservations,
              ...confirmedRes.data.data.reservations,
              ...completedRes.data.data.reservations,
            ],
          },
        },
      };
      if (isMounted.current) {
        setAllReservations(res.data.data.reservations);
      }
    } catch (err) {
      if (!isMounted.current) return;
      if (axios.isAxiosError(err) && !err.response) {
        // Backend unreachable — fall back to mock
        setAllReservations(getMockDashboardReservations());
      }
      // If it's an auth error, leave existing state and let interceptor handle it
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void loadReservations();

    // Poll every 8 seconds for live updates
    pollingRef.current = window.setInterval(() => {
      void loadReservations(true);
    }, 8_000);

    return () => {
      isMounted.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadReservations]);

  const filteredReservations = useMemo(() => {
    let res = allReservations.filter((r) => r.status === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (r) =>
          r.user.name.toLowerCase().includes(q) ||
          r.product.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }
    return res;
  }, [allReservations, activeTab, searchQuery]);

  const pendingCount = useMemo(
    () => allReservations.filter((r) => r.status === "pending").length,
    [allReservations]
  );

  const handleConfirm = async (id: string) => {
    setLoadingAction({ reservationId: id, action: "confirm" });
    try {
      await api.post<ApiResponse<{ reservation: DashboardReservation }>>(
        `/dashboard/reservations/${id}/confirm`,
        {}
      );
      setAllReservations((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "confirmed" as const, confirmed_at: new Date().toISOString() } : r
        )
      );
      showToast("Reservation confirmed");
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        // Mock fallback for offline demo
        setAllReservations((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: "confirmed" as const, confirmed_at: new Date().toISOString() } : r
          )
        );
        showToast("Reservation confirmed");
      } else {
        showToast(
          axios.isAxiosError(err) ? (err.response?.data?.message ?? "Failed to confirm") : "Failed to confirm",
          "error"
        );
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoadingAction({ reservationId: id, action: "reject" });
    try {
      await api.post(`/dashboard/reservations/${id}/reject`, {});
      setAllReservations((prev) => prev.filter((r) => r.id !== id));
      showToast("Reservation rejected");
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setAllReservations((prev) => prev.filter((r) => r.id !== id));
        showToast("Reservation rejected");
      } else {
        showToast(
          axios.isAxiosError(err) ? (err.response?.data?.message ?? "Failed to reject") : "Failed to reject",
          "error"
        );
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleComplete = async (id: string, otp: string) => {
    setLoadingAction({ reservationId: id, action: "complete" });
    try {
      await api.post(`/dashboard/reservations/${id}/complete`, { otp });
      setAllReservations((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "completed" as const, completed_at: new Date().toISOString() } : r
        )
      );
      showToast("Pickup completed");
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setAllReservations((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: "completed" as const, completed_at: new Date().toISOString() } : r
          )
        );
        showToast("Pickup completed");
      } else {
        showToast(
          axios.isAxiosError(err) ? (err.response?.data?.message ?? "Failed to complete pickup") : "Failed to complete pickup",
          "error"
        );
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <ToastContainer messages={toasts} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#525252]">Manage</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-white">Reservations</h1>
      </motion.div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide transition-all ${
                activeTab === tab.key ? "bg-white text-black" : "glass-card text-[#525252] hover:text-white"
              }`}
            >
              {tab.label}
              {tab.key === "pending" && pendingCount > 0 && (
                <span
                  className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
                    activeTab === tab.key ? "bg-black text-white" : "bg-[rgba(255,255,255,0.1)] text-white"
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-white opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>

          <div className="relative max-w-xs w-full">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]"
            >
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer or product..."
              className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => void loadReservations()}
            className="glass-card rounded-xl px-3 py-2.5 text-[#525252] hover:text-white transition-colors"
            title="Refresh"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Reservation list */}
      {loading ? (
        <Skeleton />
      ) : filteredReservations.length > 0 ? (
        <div className="space-y-4">
          {filteredReservations.map((r, i) => (
            <DashboardReservationCard
              key={r.id}
              reservation={r}
              onConfirm={handleConfirm}
              onReject={handleReject}
              onComplete={handleComplete}
              loadingAction={loadingAction?.reservationId === r.id ? loadingAction.action : null}
              index={i}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-16 text-center"
        >
          <h2 className="text-xl font-bold text-white">No {activeTab} reservations</h2>
          <p className="mt-2 text-sm text-[#525252]">
            {searchQuery ? "Try a different search term." : "New reservations will appear here automatically."}
          </p>
        </motion.div>
      )}
    </div>
  );
}
