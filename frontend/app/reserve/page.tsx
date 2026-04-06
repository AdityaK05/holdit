"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";

import CountdownTimer from "@/components/CountdownTimer";
import OTPDisplay from "@/components/OTPDisplay";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import api from "@/lib/api";
import type { ApiResponse, Product, Reservation, Store } from "@/lib/types";

function SummarySkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-10 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function ConfirmationIcon() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-8 w-8">
        <path d="m5 13 4 4L19 7" />
      </svg>
    </div>
  );
}

function ReservePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("store_id") ?? "";
  const productId = searchParams.get("product_id") ?? "";

  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [statusPulse, setStatusPulse] = useState(false);

  const loadSummary = async () => {
    if (!storeId || !productId) {
      setError("Missing reservation details");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [productResponse, storeResponse] = await Promise.all([
        api.get<ApiResponse<{ product: Product }>>(`/products/${productId}`),
        api.get<ApiResponse<{ store: Store }>>(`/stores/${storeId}`),
      ]);

      setProduct(productResponse.data.data.product);
      setStore(storeResponse.data.data.store);
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
    void loadSummary();
  }, [productId, storeId]);

  useEffect(() => {
    if (!reservation || reservation.status !== "pending") {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await api.get<ApiResponse<{ reservation: Reservation }>>(
          `/reservations/${reservation.id}`,
        );
        const nextReservation = response.data.data.reservation;

        if (nextReservation.status !== reservation.status) {
          setStatusPulse(true);
          window.setTimeout(() => setStatusPulse(false), 1200);
        }

        setReservation(nextReservation);

        if (nextReservation.status !== "pending") {
          window.clearInterval(interval);
        }
      } catch {
        window.clearInterval(interval);
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [reservation]);

  const handleConfirmReservation = async () => {
    if (!productId || !storeId) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await api.post<ApiResponse<{ reservation: Reservation }>>("/reservations", {
        product_id: productId,
        store_id: storeId,
      });
      setReservation(response.data.data.reservation);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError("Sorry, this item just went out of stock. Choose another store.");
      } else if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Something went wrong");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderReservedState = () => {
    if (!reservation || !product || !store) {
      return null;
    }

    if (reservation.status === "rejected") {
      return (
        <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">This reservation could not be confirmed</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            The store marked this item unavailable before pickup. Try another nearby store.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/stores?product_id=${productId}&name=${encodeURIComponent(product.name)}`)}
            className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Try another store
          </button>
        </div>
      );
    }

    if (reservation.status === "expired") {
      return (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Reservation expired</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Your pickup window has ended. You can reserve again if the item is still available.
          </p>
        </div>
      );
    }

    return (
      <div
        className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition ${
          statusPulse ? "scale-[1.01] shadow-lg shadow-emerald-100" : ""
        }`}
      >
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <ConfirmationIcon />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">You&apos;re reserved!</h1>
            <p className="mt-2 text-sm text-slate-600">
              {product.name} at {store.name}
            </p>
          </div>

          <OTPDisplay otp={reservation.otp} />

          <div className="flex flex-col items-center gap-3">
            {reservation.status === "pending" ? (
              <CountdownTimer expiresAt={reservation.expires_at} />
            ) : null}
            <StatusBadge status={reservation.status} />
          </div>

          <p className="text-sm leading-7 text-slate-600">
            Show this OTP to store staff when you arrive
          </p>

          {reservation.status === "confirmed" ? (
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              Your item is confirmed and ready for pickup.
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          {loading ? <SummarySkeleton /> : null}

          {!loading && error && !reservation ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-medium text-red-700">Something went wrong</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => void loadSummary()}
                className="mt-4 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : null}

          {!loading && product && store && !reservation ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-8 md:grid-cols-[240px_1fr]">
                <div className="overflow-hidden rounded-3xl bg-slate-200">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-64 items-center justify-center text-sm font-medium text-slate-500">
                      No image available
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {product.category}
                    </span>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">{product.name}</h1>
                    <p className="text-sm leading-7 text-slate-600">
                      {product.description || "This item is ready to reserve for in-store pickup."}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">{store.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{store.address}</p>
                    <p className="mt-3 text-sm text-slate-500">Selected pickup store</p>
                  </div>

                  {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

                  <div className="space-y-3">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleConfirmReservation}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                    >
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Confirming reservation...
                        </>
                      ) : (
                        "Confirm Reservation"
                      )}
                    </button>
                    <Link
                      href={`/stores?product_id=${productId}&name=${encodeURIComponent(product.name)}`}
                      className="inline-flex text-sm font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && reservation ? renderReservedState() : null}
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default function ReservePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <SummarySkeleton />
          </div>
        </main>
      }
    >
      <ReservePageContent />
    </Suspense>
  );
}
