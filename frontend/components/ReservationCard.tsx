"use client";

import type { Reservation } from "@/lib/types";

import CountdownTimer from "@/components/CountdownTimer";
import OTPDisplay from "@/components/OTPDisplay";
import StatusBadge from "@/components/StatusBadge";

interface ReservationCardProps {
  reservation: Reservation;
  onCancel: (id: string) => void;
  cancelling?: boolean;
}

export default function ReservationCard({
  reservation,
  onCancel,
  cancelling = false,
}: ReservationCardProps) {
  const createdDate = new Date(reservation.created_at).toLocaleString();
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    reservation.store.address,
  )}`;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-200">
          {reservation.product.image_url ? (
            <img
              src={reservation.product.image_url}
              alt={reservation.product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-500">
              No image
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{reservation.product.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{reservation.store.name}</p>
              <p className="mt-1 text-xs text-slate-500">Reserved on {createdDate}</p>
            </div>
            <StatusBadge status={reservation.status} />
          </div>

          {reservation.status === "pending" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CountdownTimer expiresAt={reservation.expires_at} />
              <button
                type="button"
                disabled={cancelling}
                onClick={() => {
                  const confirmed = window.confirm("Cancel this reservation?");
                  if (confirmed) {
                    onCancel(reservation.id);
                  }
                }}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? "Cancelling..." : "Cancel"}
              </button>
            </div>
          ) : null}

          {reservation.status === "confirmed" ? (
            <div className="space-y-4">
              <OTPDisplay otp={reservation.otp} />
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">{reservation.store.address}</p>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Get directions
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
