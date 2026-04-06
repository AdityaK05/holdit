"use client";

import { useEffect, useMemo, useState } from "react";

interface CountdownTimerProps {
  expiresAt: string;
}

function getRemainingSeconds(expiresAt: string) {
  const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Math.max(diff, 0);
}

export default function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(expiresAt));

  useEffect(() => {
    setRemaining(getRemainingSeconds(expiresAt));

    const interval = window.setInterval(() => {
      setRemaining(getRemainingSeconds(expiresAt));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [expiresAt]);

  const { label, className } = useMemo(() => {
    if (remaining <= 0) {
      return {
        label: "Reservation expired",
        className: "bg-red-50 text-red-700 border-red-200",
      };
    }

    if (remaining > 300) {
      return {
        label: "Time left",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }

    if (remaining > 120) {
      return {
        label: "Time left",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }

    return {
      label: "Time left",
      className: "bg-red-50 text-red-700 border-red-200",
    };
  }, [remaining]);

  if (remaining <= 0) {
    return (
      <div className={`inline-flex rounded-2xl border px-4 py-2 text-sm font-semibold ${className}`}>
        {label}
      </div>
    );
  }

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold ${className}`}>
      <span>{label}</span>
      <span className="font-mono text-base">
        {minutes}:{seconds}
      </span>
    </div>
  );
}
