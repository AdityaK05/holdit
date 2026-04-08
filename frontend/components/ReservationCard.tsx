"use client";

import type { Reservation } from "@/lib/types";
import { motion } from "framer-motion";
import CountdownTimer from "@/components/CountdownTimer";
import OTPDisplay from "@/components/OTPDisplay";
import StatusBadge from "@/components/StatusBadge";

interface ReservationCardProps {
  reservation: Reservation;
  onCancel: (id: string) => void;
  cancelling?: boolean;
  index?: number;
}

export default function ReservationCard({ reservation, onCancel, cancelling = false, index = 0 }: ReservationCardProps) {
  const createdDate = new Date(reservation.created_at).toLocaleString();
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reservation.store.address)}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30, rotateX: 8 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      viewport={{ once: true }}
      style={{ perspective: "1000px" }}
      className="glass-card overflow-hidden rounded-2xl p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)]">
          {reservation.product.image_url ? (
            <img src={reservation.product.image_url} alt={reservation.product.name} className="h-full w-full object-cover grayscale" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-8 w-8 text-[#1a1a1a]">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="1.5" /><path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">{reservation.product.name}</h3>
              <p className="mt-1 text-sm text-[#525252]">{reservation.store.name}</p>
              <p className="mt-1 text-xs text-[#3a3a3a]">{createdDate}</p>
            </div>
            <StatusBadge status={reservation.status} />
          </div>

          {reservation.status === "pending" && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CountdownTimer expiresAt={reservation.expires_at} />
              <button type="button" disabled={cancelling}
                onClick={() => { if (window.confirm("Cancel this reservation?")) onCancel(reservation.id); }}
                className="btn-danger-ghost rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40">
                {cancelling ? "Cancelling..." : "Cancel"}
              </button>
            </div>
          )}

          {reservation.status === "confirmed" && (
            <div className="space-y-4">
              <OTPDisplay otp={reservation.otp} />
              <div className="glass-surface rounded-xl p-4">
                <p className="text-sm font-medium text-white">{reservation.store.address}</p>
                <a href={directionsUrl} target="_blank" rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#a3a3a3] hover:text-white transition-colors">
                  Get directions →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
