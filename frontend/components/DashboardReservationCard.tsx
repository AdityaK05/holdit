"use client";

import { useMemo, useState } from "react";

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
}

function getRelativeTime(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds} sec ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function DashboardReservationCard({
  reservation,
  onConfirm,
  onReject,
  onComplete,
  loadingAction = null,
}: DashboardReservationCardProps) {
  const [verifiedOtp, setVerifiedOtp] = useState("");

  const createdTime = useMemo(
    () => getRelativeTime(reservation.created_at),
    [reservation.created_at],
  );
  const confirmedTime = useMemo(
    () => (reservation.confirmed_at ? getRelativeTime(reservation.confirmed_at) : null),
    [reservation.confirmed_at],
  );
  const completedTime = useMemo(
    () => (reservation.completed_at ? getRelativeTime(reservation.completed_at) : null),
    [reservation.completed_at],
  );

  const shortId = reservation.id.slice(0, 8);
  const busy = loadingAction !== null;

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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{reservation.product.name}</h3>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {reservation.product.category}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">Customer: {reservation.user.name}</p>
              <a
                href={`tel:${reservation.user.phone}`}
                className="mt-1 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {reservation.user.phone}
              </a>
              <p className="mt-2 text-xs text-slate-500">
                Created {createdTime} · ID {shortId}
              </p>
            </div>

            <StatusBadge status={reservation.status} />
          </div>

          {reservation.status === "pending" ? (
            <div className="space-y-4">
              <CountdownTimer expiresAt={reservation.expires_at} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onConfirm(reservation.id)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {loadingAction === "confirm" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Confirming...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const confirmed = window.confirm("Reject this reservation?");
                    if (confirmed) {
                      onReject(reservation.id);
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingAction === "reject" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                      Rejecting...
                    </>
                  ) : (
                    "Reject"
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {reservation.status === "confirmed" ? (
            <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-700">Verify OTP before handoff</p>
                {confirmedTime ? (
                  <p className="text-xs text-slate-500">Confirmed {confirmedTime}</p>
                ) : null}
              </div>
              <OTPVerifyInput expectedOtp={reservation.otp} onVerified={setVerifiedOtp} />
              <button
                type="button"
                disabled={busy || verifiedOtp !== reservation.otp}
                onClick={() => onComplete(reservation.id, verifiedOtp)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {loadingAction === "complete" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Updating...
                  </>
                ) : (
                  "Mark as Picked Up"
                )}
              </button>
            </div>
          ) : null}

          {reservation.status === "completed" ? (
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-700">Completed</p>
              {completedTime ? (
                <p className="mt-1 text-sm text-emerald-700">Picked up {completedTime}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
