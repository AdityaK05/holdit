"use client";

import { useEffect, useMemo, useState } from "react";

interface CountdownTimerProps { expiresAt: string; }

function getRemainingSeconds(expiresAt: string) {
  return Math.max(Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000), 0);
}

export default function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(expiresAt));

  useEffect(() => {
    setRemaining(getRemainingSeconds(expiresAt));
    const interval = window.setInterval(() => setRemaining(getRemainingSeconds(expiresAt)), 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  const { textColor, ringColor } = useMemo(() => {
    if (remaining <= 0) return { textColor: "text-[#525252]", ringColor: "#525252" };
    if (remaining > 300) return { textColor: "text-white", ringColor: "#ffffff" };
    if (remaining > 120) return { textColor: "text-[#a3a3a3]", ringColor: "#a3a3a3" };
    return { textColor: "text-[#d4d4d4]", ringColor: "#d4d4d4" };
  }, [remaining]);

  const totalDuration = 600;
  const progress = Math.min(remaining / totalDuration, 1);
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference * (1 - progress);

  if (remaining <= 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm font-semibold text-[#525252]">
        Expired
      </div>
    );
  }

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5">
      <div className="relative h-9 w-9 flex-shrink-0">
        <svg className="h-9 w-9 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          <circle cx="20" cy="20" r="18" fill="none" stroke={ringColor} strokeWidth="2" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear" />
        </svg>
      </div>
      <div>
        <p className={`font-mono text-lg font-bold tracking-[0.15em] ${textColor}`}>{minutes}:{seconds}</p>
      </div>
    </div>
  );
}
