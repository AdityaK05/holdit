"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountdownTimer from "@/components/CountdownTimer";
import OTPVerifyInput from "@/components/OTPVerifyInput";
import StatusBadge from "@/components/StatusBadge";
import type { DashboardReservation } from "@/lib/types";

interface DashboardReservationCardProps {
  reservation: DashboardReservation;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onComplete: (id: string, otp: string) => void;
  loadingAction?: "confirm" | "reject" | "complete" | null;
  index?: number;
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

function PaymentStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Unpaid", cls: "text-[#a3a3a3] border-[rgba(255,255,255,0.08)]" },
    partially_paid: { label: "Partial", cls: "text-[#d4a017] border-[#d4a017]/30 bg-[#d4a017]/10" },
    fully_paid: { label: "Paid ✓", cls: "text-white border-white/20 bg-white/10" },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

export default function DashboardReservationCard({
  reservation, onConfirm, onReject, onComplete, loadingAction = null, index = 0
}: DashboardReservationCardProps) {
  const [verifiedOtp, setVerifiedOtp] = useState("");
  const createdTime = useMemo(() => getRelativeTime(reservation.created_at), [reservation.created_at]);
  const shortId = reservation.id.slice(0, 8);
  const busy = loadingAction !== null;

  const totalAmount = ((reservation.total_amount_paise ?? 0) / 100);
  const paidAmount = ((reservation.paid_amount_paise ?? 0) / 100);
  const outstandingAmount = Math.max(totalAmount - paidAmount, 0);
  const hasOutstanding = totalAmount > 0 && outstandingAmount > 0;
  const isFullyPaid = totalAmount > 0 && outstandingAmount <= 0;

  // Block completion if payment is outstanding
  const canComplete = !hasOutstanding && verifiedOtp === reservation.otp;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      viewport={{ once: true }}
      className="glass-card overflow-hidden rounded-2xl p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row">
        {/* Product thumbnail */}
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)]">
          {reservation.product.image_url ? (
            <img src={reservation.product.image_url} alt={reservation.product.name} className="h-full w-full object-cover grayscale" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-8 w-8 text-[#1a1a1a]">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          {/* Header row */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold tracking-tight text-white">{reservation.product.name}</h3>
                <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#525252]">
                  {reservation.product.category}
                </span>
                <PaymentStatusBadge status={reservation.payment_status} />
              </div>
              <p className="mt-1 text-sm text-[#525252]">Customer: {reservation.user.name}</p>
              <a href={`tel:${reservation.user.phone}`} className="mt-1 inline-flex text-sm font-medium text-[#a3a3a3] hover:text-white transition-colors">
                {reservation.user.phone}
              </a>
              <p className="mt-2 text-xs text-[#3a3a3a]">{createdTime} · {shortId}</p>
            </div>
            <StatusBadge status={reservation.status} />
          </div>

          {/* Payment breakdown (if product has a price) */}
          {totalAmount > 0 && (
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-3 text-xs text-[#a3a3a3]">
              <div className="flex justify-between">
                <span>Total</span><span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Paid</span><span className={isFullyPaid ? "text-white" : ""}>₹{paidAmount.toFixed(2)}</span>
              </div>
              {hasOutstanding && (
                <div className="mt-1 border-t border-[rgba(255,255,255,0.06)] pt-1 flex justify-between font-semibold text-[#a3a3a3]">
                  <span>Outstanding</span><span>₹{outstandingAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Pending actions */}
          {reservation.status === "pending" && (
            <div className="space-y-4">
              <CountdownTimer expiresAt={reservation.expires_at} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" disabled={busy} onClick={() => onConfirm(reservation.id)}
                  className="btn-gradient flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm">
                  {loadingAction === "confirm" ? <><span className="spinner-orbital-sm" /> Confirming...</> : "Confirm"}
                </button>
                <button type="button" disabled={busy}
                  onClick={() => { if (window.confirm("Reject this reservation?")) onReject(reservation.id); }}
                  className="btn-danger-ghost flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-40">
                  {loadingAction === "reject" ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          )}

          {/* Confirmed — OTP verify + pickup */}
          {reservation.status === "confirmed" && (
            <div className="space-y-4 glass-surface rounded-xl p-4">
              <p className="text-sm font-medium text-white">Verify OTP to complete pickup</p>
              <OTPVerifyInput expectedOtp={reservation.otp} onVerified={setVerifiedOtp} />

              {hasOutstanding && (
                <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[#a3a3a3]">
                  ⚠️ Outstanding balance of <span className="font-semibold text-white">₹{outstandingAmount.toFixed(2)}</span> must be collected before pickup.
                </div>
              )}

              <button type="button"
                disabled={busy || !canComplete}
                onClick={() => onComplete(reservation.id, verifiedOtp)}
                className="btn-gradient flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm disabled:opacity-40">
                {loadingAction === "complete" ? <><span className="spinner-orbital-sm" /> Updating...</> : "Mark Picked Up"}
              </button>
            </div>
          )}

          {/* Completed */}
          {reservation.status === "completed" && (
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="font-semibold text-white">✓ Completed</p>
              {reservation.completed_at && (
                <p className="mt-1 text-xs text-[#525252]">
                  {new Date(reservation.completed_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
