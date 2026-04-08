"use client";

import type { Reservation } from "@/lib/types";

type ReservationStatus = Reservation["status"];

interface StatusBadgeProps { status: ReservationStatus; }

const statusStyles: Record<ReservationStatus, { label: string; dotBg: string; bg: string; text: string; pulse: boolean }> = {
  pending:   { label: "Awaiting", dotBg: "bg-white", bg: "bg-[rgba(255,255,255,0.06)]", text: "text-[#a3a3a3]", pulse: true },
  confirmed: { label: "Ready",  dotBg: "bg-white", bg: "bg-[rgba(255,255,255,0.06)]", text: "text-white", pulse: false },
  rejected:  { label: "Unavailable", dotBg: "bg-[#525252]", bg: "bg-[rgba(255,255,255,0.03)]", text: "text-[#525252]", pulse: false },
  completed: { label: "Picked up", dotBg: "bg-[#525252]", bg: "bg-[rgba(255,255,255,0.03)]", text: "text-[#525252]", pulse: false },
  expired:   { label: "Expired", dotBg: "bg-[#3a3a3a]", bg: "bg-[rgba(255,255,255,0.02)]", text: "text-[#3a3a3a]", pulse: false },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const c = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs font-semibold tracking-wide uppercase ${c.bg} ${c.text}`}>
      <span className="relative flex h-1.5 w-1.5">
        {c.pulse && <span className={`absolute inset-0 rounded-full ${c.dotBg} animate-ping opacity-40`} />}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${c.dotBg}`} />
      </span>
      {c.label}
    </span>
  );
}
