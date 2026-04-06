"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

interface OTPVerifyInputProps {
  expectedOtp: string;
  onVerified: (otp: string) => void;
}

export default function OTPVerifyInput({
  expectedOtp,
  onVerified,
}: OTPVerifyInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setDigits(Array(6).fill(""));
  }, [expectedOtp]);

  const code = digits.join("");
  const isComplete = digits.every((digit) => digit.length === 1);
  const isValid = isComplete && code === expectedOtp;
  const isInvalid = isComplete && code !== expectedOtp;

  useEffect(() => {
    if (isComplete) {
      onVerified(code);
    }
  }, [code, isComplete, onVerified]);

  const inputClassName = useMemo(() => {
    if (isInvalid) {
      return "border-red-400 bg-red-50 text-red-700";
    }
    if (isValid) {
      return "border-emerald-400 bg-emerald-50 text-emerald-700";
    }
    return "border-slate-300 bg-white text-slate-900";
  }, [isInvalid, isValid]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            className={`h-12 w-12 rounded-2xl border text-center text-xl font-bold shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${inputClassName}`}
          />
        ))}
      </div>
      {isInvalid ? (
        <p className="text-sm font-medium text-red-600">Invalid OTP</p>
      ) : isValid ? (
        <p className="text-sm font-medium text-emerald-600">OTP verified</p>
      ) : null}
    </div>
  );
}
