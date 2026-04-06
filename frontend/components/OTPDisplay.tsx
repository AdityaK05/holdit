"use client";

import { useState } from "react";

interface OTPDisplayProps {
  otp: string;
}

export default function OTPDisplay({ otp }: OTPDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(otp);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-3xl bg-blue-600 p-5 text-white shadow-lg shadow-blue-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-100">Your pickup code</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {otp.split("").map((digit, index) => (
              <div
                key={`${digit}-${index}`}
                className="flex h-14 w-12 items-center justify-center rounded-2xl bg-white/15 font-mono text-3xl font-bold tracking-widest"
              >
                {digit}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
