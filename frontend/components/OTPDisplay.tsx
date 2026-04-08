"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface OTPDisplayProps { otp: string; }

export default function OTPDisplay({ otp }: OTPDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(otp); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Pickup Code</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {otp.split("").map((digit, i) => (
              <motion.div
                key={`${digit}-${i}`}
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                style={{ perspective: "600px" }}
                className="flex h-14 w-12 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] font-mono text-3xl font-bold text-white"
              >
                {digit}
              </motion.div>
            ))}
          </div>
        </div>
        <button type="button" onClick={handleCopy}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
            copied ? "bg-[rgba(255,255,255,0.08)] text-white border border-[rgba(255,255,255,0.2)]"
                   : "bg-[rgba(255,255,255,0.05)] text-[#a3a3a3] border border-[rgba(255,255,255,0.08)] hover:text-white hover:border-[rgba(255,255,255,0.15)]"
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
