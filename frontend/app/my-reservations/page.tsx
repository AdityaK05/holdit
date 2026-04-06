"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import ProtectedRoute from "@/components/ProtectedRoute";
import ReservationCard from "@/components/ReservationCard";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { ApiResponse, Reservation } from "@/lib/types";

function ReservationSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-5">
        <div className="h-24 w-24 animate-pulse rounded-2xl bg-slate-200" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-slate-200" />
          <div className="h-10 w-full animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingIds, setCancellingIds] = useState<string[]>([]);

  const loadReservations = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<ApiResponse<{ reservations: Reservation[] }>>("/reservations/me");
      setReservations(response.data.data.reservations);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Something went wrong");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    void loadReservations();
  }, []);

  const activeReservations = useMemo(
    () => reservations.filter((reservation) => ["pending", "confirmed"].includes(reservation.status)),
    [reservations],
  );
  const pastReservations = useMemo(
    () => reservations.filter((reservation) => !["pending", "confirmed"].includes(reservation.status)),
    [reservations],
  );

  const handleCancel = async (reservationId: string) => {
    setCancellingIds((current) => [...current, reservationId]);

    try {
      await api.delete(`/reservations/${reservationId}`);
      setReservations((current) => current.filter((reservation) => reservation.id !== reservationId));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Something went wrong");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setCancellingIds((current) => current.filter((id) => id !== reservationId));
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">My reservations</h1>
            <p className="mt-2 text-sm text-slate-600">
              Track active holds and review your recent pickup history.
            </p>
          </div>

          {error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-medium text-red-700">Something went wrong</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => void loadReservations()}
                className="mt-4 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <ReservationSkeleton key={index} />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">No reservations yet. Start searching!</h2>
              <p className="mt-2 text-sm text-slate-600">
                Once you reserve something, it will show up here.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Active</h2>
                  <span className="text-sm text-slate-500">{activeReservations.length} items</span>
                </div>
                <div className="space-y-4">
                  {activeReservations.length ? (
                    activeReservations.map((reservation) => (
                      <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        cancelling={cancellingIds.includes(reservation.id)}
                        onCancel={handleCancel}
                      />
                    ))
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
                      No active reservations right now.
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Past</h2>
                  <span className="text-sm text-slate-500">{pastReservations.length} items</span>
                </div>
                <div className="space-y-4">
                  {pastReservations.length ? (
                    pastReservations.map((reservation) => (
                      <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        onCancel={handleCancel}
                      />
                    ))
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
                      No past reservations yet.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
