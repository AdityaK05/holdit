"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

interface OTPVerifyInputProps { expectedOtp: string; onVerified: (otp: string) => void; }

export default function OTPVerifyInput({ expectedOtp, onVerified }: OTPVerifyInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { setDigits(Array(6).fill("")); }, [expectedOtp]);

  const code = digits.join("");
  const isComplete = digits.every((d) => d.length === 1);
  const isValid = isComplete && code === expectedOtp;
  const isInvalid = isComplete && code !== expectedOtp;

  useEffect(() => { if (isComplete) onVerified(code); }, [code, isComplete, onVerified]);

  const inputClass = useMemo(() => {
    if (isInvalid) return "border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.06)] text-white";
    if (isValid) return "border-[rgba(255,255,255,0.4)] bg-[rgba(255,255,255,0.08)] text-white";
    return "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-white";
  }, [isInvalid, isValid]);

  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = d; setDigits(next);
    if (d && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {digits.map((digit, i) => (
          <input key={i} ref={(el) => { inputRefs.current[i] = el; }} value={digit}
            onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)}
            inputMode="numeric" pattern="[0-9]*" maxLength={1}
            className={`h-12 w-12 rounded-lg border text-center font-mono text-xl font-bold transition-all duration-300 focus:border-[rgba(255,255,255,0.3)] focus:shadow-[0_0_20px_rgba(255,255,255,0.05)] focus:outline-none ${inputClass}`}
          />
        ))}
      </div>
      {isInvalid && <p className="text-sm font-medium text-[#a3a3a3]">Invalid OTP</p>}
      {isValid && <p className="text-sm font-medium text-white">✓ Verified</p>}
    </div>
  );
}
