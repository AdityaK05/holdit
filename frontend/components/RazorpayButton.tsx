"use client";

import { useEffect, useRef, useState } from "react";
import type { RazorpayOptions, RazorpayPaymentResponse } from "@/lib/types";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface Props {
  options: RazorpayOptions;
  onSuccess: (response: RazorpayPaymentResponse) => void;
  onDismiss?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Dynamically loads the Razorpay checkout.js script once, then fires the
 *  payment modal when the user clicks. Fully controlled via props. */
export default function RazorpayButton({
  options,
  onSuccess,
  onDismiss,
  children,
  disabled = false,
  className = "",
}: Props) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Already in DOM (e.g. hot-reload)
    if (document.getElementById("razorpay-script")) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptError(true);
    document.body.appendChild(script);
    scriptRef.current = script;
  }, []);

  const handleClick = () => {
    if (!scriptLoaded || !window.Razorpay) return;
    const rzp = new window.Razorpay({
      ...options,
      handler: onSuccess,
      modal: { ondismiss: onDismiss },
    });
    rzp.open();
  };

  if (scriptError) {
    return (
      <p className="text-sm text-[#a3a3a3]">
        Payment gateway unavailable. Please refresh.
      </p>
    );
  }

  return (
    <button
      type="button"
      id="razorpay-pay-btn"
      onClick={handleClick}
      disabled={disabled || !scriptLoaded}
      className={className}
    >
      {children}
    </button>
  );
}
