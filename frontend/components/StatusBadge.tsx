"use client";

import type { Reservation } from "@/lib/types";

type ReservationStatus = Reservation["status"];

interface StatusBadgeProps {
  status: ReservationStatus;
}

const statusStyles: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Awaiting confirmation",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Confirmed - ready for pickup",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Unavailable",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  completed: {
    label: "Picked up",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  expired: {
    label: "Expired",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusStyles[status];

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
