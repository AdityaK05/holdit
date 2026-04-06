"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import axios from "axios";

import DashboardReservationCard from "@/components/DashboardReservationCard";
import api from "@/lib/api";
import type { ApiResponse, DashboardReservation } from "@/lib/types";

type DashboardTab = "pending" | "confirmed" | "completed";
type LoadingAction = {
  reservationId: string;
  action: "confirm" | "reject" | "complete";
} | null;

const tabConfig: Record<DashboardTab, { label: string }> = {
  pending: { label: "Pending" },
  confirmed: { label: "Confirmed" },
  completed: { label: "Completed" },
};

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-5">
            <div className="h-24 w-24 animate-pulse rounded-2xl bg-slate-200" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-slate-200" />
              <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorToast({
  messages,
}: {
  messages: Array<{ id: number; message: string }>;
}) {
  return (
    <div className="fixed right-4 top-24 z-50 space-y-3">
      {messages.map((toast) => (
        <div
          key={toast.id}
          className="max-w-sm rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-lg"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: DashboardTab =
    rawTab === "confirmed" || rawTab === "completed" ? rawTab : "pending";

  const [reservationsByTab, setReservationsByTab] = useState<Record<DashboardTab, DashboardReservation[]>>({
    pending: [],
    confirmed: [],
    completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([]);

  const showToast = (message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const fetchReservations = async (tab: DashboardTab, preserveLoading = false) => {
    if (!preserveLoading) {
      setLoading(true);
    }

    try {
      const [tabResponse, pendingResponse] = await Promise.all([
        api.get<ApiResponse<{ reservations: DashboardReservation[] }>>(
          `/dashboard/reservations?status=${tab}`,
        ),
        api.get<ApiResponse<{ reservations: DashboardReservation[] }>>(
          "/dashboard/reservations?status=pending",
        ),
      ]);

      setReservationsByTab((current) => ({
        ...current,
        [tab]: tabResponse.data.data.reservations,
        pending: tab === "pending" ? tabResponse.data.data.reservations : current.pending,
      }));
      setPendingCount(pendingResponse.data.data.reservations.length);
      if (tab !== "pending") {
        setReservationsByTab((current) => ({
          ...current,
          pending: pendingResponse.data.data.reservations,
        }));
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast(err.response?.data?.message ?? "Something went wrong");
      } else {
        showToast("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tab = ["pending", "confirmed", "completed"].includes(activeTab)
      ? activeTab
      : "pending";

    if (tab !== activeTab) {
      router.replace(`/dashboard?tab=${tab}`);
      return;
    }

    void fetchReservations(tab as DashboardTab);

    const interval = window.setInterval(() => {
      void fetchReservations(tab as DashboardTab, true);
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeTab, router]);

  const currentReservations = useMemo(
    () => reservationsByTab[activeTab] ?? [],
    [activeTab, reservationsByTab],
  );

  const moveReservation = (
    reservation: DashboardReservation,
    targetTab: DashboardTab | null,
  ) => {
    setReservationsByTab((current) => {
      const next: Record<DashboardTab, DashboardReservation[]> = {
        pending: current.pending.filter((item) => item.id !== reservation.id),
        confirmed: current.confirmed.filter((item) => item.id !== reservation.id),
        completed: current.completed.filter((item) => item.id !== reservation.id),
      };

      if (targetTab) {
        next[targetTab] = [reservation, ...next[targetTab]];
      }

      return next;
    });
  };

  const handleConfirm = async (reservationId: string) => {
    setLoadingAction({ reservationId, action: "confirm" });

    try {
      const response = await api.post<ApiResponse<{ reservation: DashboardReservation }>>(
        `/dashboard/reservations/${reservationId}/confirm`,
        {},
      );
      moveReservation(response.data.data.reservation, "confirmed");
      setPendingCount((current) => Math.max(current - 1, 0));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast(err.response?.data?.message ?? "Something went wrong");
      } else {
        showToast("Something went wrong");
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (reservationId: string) => {
    setLoadingAction({ reservationId, action: "reject" });

    try {
      const response = await api.post<ApiResponse<{ reservation: DashboardReservation }>>(
        `/dashboard/reservations/${reservationId}/reject`,
        {},
      );
      moveReservation(response.data.data.reservation, null);
      setPendingCount((current) => Math.max(current - 1, 0));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast(err.response?.data?.message ?? "Something went wrong");
      } else {
        showToast("Something went wrong");
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleComplete = async (reservationId: string, otp: string) => {
    setLoadingAction({ reservationId, action: "complete" });

    try {
      const response = await api.post<ApiResponse<{ reservation: DashboardReservation }>>(
        `/dashboard/reservations/${reservationId}/complete`,
        { otp },
      );
      moveReservation(response.data.data.reservation, "completed");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast(err.response?.data?.message ?? "Something went wrong");
      } else {
        showToast("Something went wrong");
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <ErrorToast messages={toasts} />

      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            Staff dashboard
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            {tabConfig[activeTab].label} reservations
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          {(Object.keys(tabConfig) as DashboardTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => router.push(`/dashboard?tab=${tab}`)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tabConfig[tab].label}</span>
              {tab === "pending" && pendingCount > 0 ? (
                <span
                  className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === tab ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
                  }`}
                >
                  {pendingCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : currentReservations.length ? (
          <div className="space-y-4">
            {currentReservations.map((reservation) => (
              <DashboardReservationCard
                key={reservation.id}
                reservation={reservation}
                onConfirm={handleConfirm}
                onReject={handleReject}
                onComplete={handleComplete}
                loadingAction={
                  loadingAction?.reservationId === reservation.id ? loadingAction.action : null
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              No {activeTab} reservations
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              New reservations for this stage will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <DashboardSkeleton />
          </div>
        </main>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
