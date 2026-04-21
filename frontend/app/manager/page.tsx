"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { mockAnalytics, mockDashboardReservations } from "@/lib/mock-data";
import type { ApiResponse, DashboardAnalytics, DashboardReservation } from "@/lib/types";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function AnalyticsCard({
  label,
  value,
  suffix,
  icon,
  delay,
  loading,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  delay: number;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">{label}</p>
          {loading ? (
            <div className="mt-3 h-10 w-20 rounded skeleton-shimmer" />
          ) : (
            <p className="mt-3 text-4xl font-bold tracking-tight text-white">
              {value}
              {suffix && <span className="ml-1 text-lg text-[#525252]">{suffix}</span>}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] text-[#525252]">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function WeeklyChart({ data, loading }: { data: number[]; loading?: boolean }) {
  const max = Math.max(...data, 1);
  if (loading) {
    return (
      <div className="flex items-end gap-2 h-24">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full h-full rounded-t-md skeleton-shimmer" />
            <span className="text-[10px] text-[#3a3a3a]">{days[i]}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((val, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(val / max) * 100}%` }}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
            className="w-full min-h-[4px] rounded-t-md bg-white/20 hover:bg-white/40 transition-colors"
          />
          <span className="text-[10px] text-[#3a3a3a]">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function getRelativeTime(dateString: string) {
  const s = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const statusColors: Record<string, string> = {
  pending: "bg-white/80",
  confirmed: "bg-white",
  completed: "bg-[#525252]",
  rejected: "bg-[#3a3a3a]",
  expired: "bg-[#3a3a3a]",
};

export default function ManagerOverviewPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [recentReservations, setRecentReservations] = useState<DashboardReservation[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get<ApiResponse<{ analytics: DashboardAnalytics }>>(
          "/dashboard/analytics"
        );
        setAnalytics(res.data.data.analytics);
      } catch (err) {
        if (axios.isAxiosError(err) && !err.response) {
          // Backend unreachable — fall back to mock
          setAnalytics(mockAnalytics);
        } else {
          setAnalytics(mockAnalytics);
        }
      } finally {
        setLoadingAnalytics(false);
      }
    };

    const fetchReservations = async () => {
      try {
        const res = await api.get<ApiResponse<{ reservations: DashboardReservation[] }>>(
          "/dashboard/reservations"
        );
        setRecentReservations(res.data.data.reservations.slice(0, 5));
      } catch (err) {
        if (axios.isAxiosError(err) && !err.response) {
          setRecentReservations(mockDashboardReservations.slice(0, 5));
        } else {
          setRecentReservations(mockDashboardReservations.slice(0, 5));
        }
      } finally {
        setLoadingReservations(false);
      }
    };

    void fetchAnalytics();
    void fetchReservations();

    // Refresh analytics every 30 seconds
    const interval = window.setInterval(() => {
      void fetchAnalytics();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const displayAnalytics = analytics ?? mockAnalytics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#525252]">Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-white">Overview</h1>
      </motion.div>

      {/* Analytics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          label="Today's Reservations" value={displayAnalytics.todayReservations} delay={0.1} loading={loadingAnalytics}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
        />
        <AnalyticsCard
          label="Pending Pickups" value={displayAnalytics.pendingPickups} delay={0.15} loading={loadingAnalytics}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
        />
        <AnalyticsCard
          label="Completed Today" value={displayAnalytics.completedToday} delay={0.2} loading={loadingAnalytics}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>}
        />
        <AnalyticsCard
          label="Avg. Pickup Time" value={displayAnalytics.avgPickupMinutes} suffix="min" delay={0.25} loading={loadingAnalytics}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>}
        />
      </div>

      {/* Revenue Today */}
      {!loadingAnalytics && displayAnalytics.revenueTodayPaise !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Revenue Today</p>
              <p className="mt-2 text-3xl font-bold text-white">
                ₹{((displayAnalytics.revenueTodayPaise ?? 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-[#525252]">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </motion.div>
      )}

      {/* Two-column: Weekly Trend + Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card rounded-2xl p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Weekly Trend</p>
          <div className="mt-6">
            <WeeklyChart data={displayAnalytics.weeklyTrend} loading={loadingAnalytics} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
          className="glass-card rounded-2xl p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Top Products</p>
          <div className="mt-5 space-y-3">
            {loadingAnalytics
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded skeleton-shimmer" />
                    <div className="h-4 w-6 rounded skeleton-shimmer" />
                  </div>
                ))
              : displayAnalytics.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgba(255,255,255,0.06)] text-[10px] font-bold text-[#525252]">{i + 1}</span>
                      <span className="text-sm text-white">{p.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#525252]">{p.count}</span>
                  </div>
                ))}
          </div>
        </motion.div>
      </div>

      {/* Live Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Recent Activity</p>
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-white opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
        </div>

        <div className="mt-5 space-y-1">
          {loadingReservations
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl px-3 py-3">
                  <div className="h-2 w-2 rounded-full skeleton-shimmer shrink-0" />
                  <div className="h-8 w-8 rounded-lg skeleton-shimmer shrink-0" />
                  <div className="flex-1 h-4 rounded skeleton-shimmer" />
                </div>
              ))
            : recentReservations.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                  className="group flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                >
                  <div className={`h-2 w-2 shrink-0 rounded-full ${statusColors[r.status] ?? "bg-[#3a3a3a]"}`} />
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-[rgba(255,255,255,0.06)]">
                    {r.product.image_url ? (
                      <img src={r.product.image_url} alt="" className="h-full w-full object-cover grayscale" />
                    ) : (
                      <div className="h-full w-full bg-[#0a0a0a]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">
                      <span className="font-semibold">{r.user.name}</span>
                      <span className="text-[#525252]"> reserved </span>
                      <span className="font-medium">{r.product.name}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#525252]">
                      {r.status}
                    </span>
                    <span className="text-xs text-[#3a3a3a]">{getRelativeTime(r.created_at)}</span>
                  </div>
                </motion.div>
              ))}
          {!loadingReservations && recentReservations.length === 0 && (
            <p className="px-3 py-4 text-sm text-[#525252]">No recent activity.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
