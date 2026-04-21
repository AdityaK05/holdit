"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import CountdownTimer from "@/components/CountdownTimer";
import OTPDisplay from "@/components/OTPDisplay";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import api from "@/lib/api";
import { mockProducts, mockStores } from "@/lib/mock-data";
import type { ApiResponse, Product, Reservation, Store } from "@/lib/types";

function SummarySkeleton() {
  return <div className="glass-card rounded-2xl p-8"><div className="grid gap-8 md:grid-cols-[220px_1fr]"><div className="h-56 rounded-2xl skeleton-shimmer" /><div className="space-y-4"><div className="h-4 w-32 rounded skeleton-shimmer" /><div className="h-8 w-2/3 rounded skeleton-shimmer" /><div className="h-4 w-full rounded skeleton-shimmer" /><div className="h-12 w-full rounded-xl skeleton-shimmer" /></div></div></div>;
}

/**
 * Build a mock reservation object so the full reservation flow is
 * explorable even when the backend is unreachable.
 */
function createMockReservation(productId: string, storeId: string): Reservation {
  const product = mockProducts.find((p) => p.id === productId) ?? mockProducts[0];
  const store = mockStores.find((s) => s.id === storeId) ?? mockStores[0];
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  return {
    id: `mock-res-${Date.now()}`,
    user_id: "mock-user",
    store_id: store.id,
    product_id: product.id,
    status: "confirmed",
    otp,
    expires_at: new Date(Date.now() + 600000).toISOString(),
    confirmed_at: new Date().toISOString(),
    completed_at: null,
    created_at: new Date().toISOString(),
    store: { id: store.id, name: store.name, address: store.address, lat: store.lat, lng: store.lng, phone: store.phone, is_active: true },
    product: { id: product.id, name: product.name, description: product.description, category: product.category, image_url: product.image_url, created_at: product.created_at },
  };
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

  const loadSummary = async () => {
    if (!storeId || !productId) { setError("Missing details"); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const [pRes, sRes] = await Promise.all([
        api.get<ApiResponse<{ product: Product }>>(`/products/${productId}`),
        api.get<ApiResponse<{ store: Store }>>(`/stores/${storeId}`),
      ]);
      setProduct(pRes.data.data.product); setStore(sRes.data.data.store);
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        // Backend unreachable — use mock data
        const mockProduct = mockProducts.find((p) => p.id === productId) ?? mockProducts[0];
        const mockStore = mockStores.find((s) => s.id === storeId) ?? mockStores[0];
        setProduct(mockProduct);
        setStore({ id: mockStore.id, name: mockStore.name, address: mockStore.address, lat: mockStore.lat, lng: mockStore.lng, phone: mockStore.phone, is_active: true });
        setLoading(false);
        return;
      }
      if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? "Something went wrong");
      else setError("Something went wrong");
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadSummary(); }, [productId, storeId]);

  useEffect(() => {
    if (!reservation || reservation.status !== "pending") return;
    const interval = window.setInterval(async () => {
      try {
        const res = await api.get<ApiResponse<{ reservation: Reservation }>>(`/reservations/${reservation.id}`);
        setReservation(res.data.data.reservation);
        if (res.data.data.reservation.status !== "pending") window.clearInterval(interval);
      } catch { window.clearInterval(interval); }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [reservation]);

  const handleConfirm = async () => {
    if (!productId || !storeId) return;
    setSubmitting(true); setError("");
    try {
      const res = await api.post<ApiResponse<{ reservation: Reservation }>>("/reservations", { product_id: productId, store_id: storeId });
      setReservation(res.data.data.reservation);
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        // Backend unreachable — create mock reservation
        setReservation(createMockReservation(productId, storeId));
        setSubmitting(false);
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 409) setError("Item just went out of stock.");
      else if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? "Something went wrong");
      else setError("Something went wrong");
    } finally { setSubmitting(false); }
  };

  const renderReserved = () => {
    if (!reservation || !product || !store) return null;
    const totalAmount = ((reservation.total_amount_paise ?? product.price_paise ?? 0) / 100) || 0;
    const paidAmount = (reservation.paid_amount_paise ?? 0) / 100;
    const outstandingAmount = Math.max(totalAmount - paidAmount, 0);

    if (reservation.status === "rejected") {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-12 text-center">
          <h2 className="text-2xl font-bold text-white">Unavailable</h2>
          <p className="mt-3 text-sm text-[#525252]">Store couldn&apos;t confirm. Try another.</p>
          <button type="button" onClick={() => router.push(`/stores?product_id=${productId}&name=${encodeURIComponent(product.name)}`)}
            className="btn-gradient mt-6 rounded-xl px-5 py-3 text-sm">Try another store</button>
        </motion.div>
      );
    }
    if (reservation.status === "expired") {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-12 text-center">
          <h2 className="text-2xl font-bold text-white">Expired</h2>
          <p className="mt-3 text-sm text-[#525252]">Your window closed. Reserve again if available.</p>
        </motion.div>
      );
    }
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        className="glass-card rounded-2xl p-8">
        <div className="mx-auto max-w-2xl space-y-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-white text-black">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-8 w-8"><path d="m5 13 4 4L19 7" /></svg>
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">Reserved!</h1>
            <p className="mt-2 text-sm text-[#525252]">{product.name} at {store.name}</p>
          </div>
          <OTPDisplay otp={reservation.otp} />

          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 text-left text-sm">
            <div className="flex justify-between text-[#a3a3a3]">
              <span>Total price</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between text-[#a3a3a3]">
              <span>Paid</span>
              <span>₹{paidAmount.toFixed(2)}</span>
            </div>
            <div className="mt-2 border-t border-[rgba(255,255,255,0.08)] pt-2 flex justify-between font-semibold text-white">
              <span>Outstanding</span>
              <span>₹{outstandingAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            {reservation.status === "pending" && <CountdownTimer expiresAt={reservation.expires_at} />}
            <StatusBadge status={reservation.status} />
            {reservation.payment_status && (
              <span className="rounded-full border border-[rgba(255,255,255,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a3a3a3]">
                Payment: {reservation.payment_status.replace("_", " ")}
              </span>
            )}
          </div>

          {outstandingAmount > 0 && (
            <Link
              href={`/checkout?reservation_id=${reservation.id}&store_id=${store.id}&product_id=${product.id}`}
              className="btn-gradient inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm"
            >
              {paidAmount > 0 ? "Pay Remaining" : "Pay Now"}
            </Link>
          )}

          {reservation.status === "confirmed" && outstandingAmount <= 0 && (
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 text-sm font-medium text-white">
              Ready for pickup — show your OTP in store.
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <ProtectedRoute>
      <main className="min-h-[calc(100vh-73px)] px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          {loading && <SummarySkeleton />}
          {!loading && error && !reservation && (
            <div className="glass-card rounded-2xl p-6"><p className="text-sm text-[#a3a3a3]">{error}</p>
              <button type="button" onClick={() => void loadSummary()} className="btn-gradient mt-4 rounded-xl px-4 py-2 text-sm">Retry</button></div>
          )}
          {!loading && product && store && !reservation && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-card rounded-2xl p-8">
              <div className="grid gap-8 md:grid-cols-[240px_1fr]">
                <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)]">
                  {product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover grayscale" />
                    : <div className="flex h-64 items-center justify-center bg-[#0a0a0a] text-[#1a1a1a]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></div>}
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#525252]">{product.category}</span>
                    <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">{product.name}</h1>
                    <p className="text-sm leading-7 text-[#525252]">{product.description || "Ready to reserve."}</p>
                  </div>
                  <div className="glass-surface rounded-xl p-5">
                    <p className="text-sm font-semibold text-white">{store.name}</p>
                    <p className="mt-1 text-sm text-[#525252]">{store.address}</p>
                  </div>
                  {error && <p className="text-sm text-[#a3a3a3]">{error}</p>}
                  <button type="button" disabled={submitting} onClick={handleConfirm}
                    className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm">
                    {submitting ? <><span className="spinner-orbital-sm" /> Reserving...</> : "Confirm Reservation"}
                  </button>
                  <Link href={`/stores?product_id=${productId}&name=${encodeURIComponent(product.name)}`}
                    className="inline-flex text-sm font-semibold text-[#525252] hover:text-white transition-colors">← Different store</Link>
                </div>
              </div>
            </motion.div>
          )}
          {!loading && reservation && renderReserved()}
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default function ReservePage() {
  return <Suspense fallback={<main className="min-h-[calc(100vh-73px)] px-6 py-16 lg:px-8"><div className="mx-auto max-w-5xl"><SummarySkeleton /></div></main>}><ReservePageContent /></Suspense>;
}
