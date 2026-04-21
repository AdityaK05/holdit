"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id") ?? "";
  const reservationId = searchParams.get("reservation_id") ?? "";
  const amount = searchParams.get("amount") ?? "0";

  return (
    <main className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg space-y-8 text-center">

        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full
                     border border-[rgba(255,255,255,0.15)]
                     bg-gradient-to-br from-white/10 to-white/5
                     shadow-[0_0_60px_rgba(255,255,255,0.08)]"
        >
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 text-white"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <motion.path d="m5 13 4 4L19 7" />
          </motion.svg>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-white">
            Payment Successful
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#525252]">
            Your reservation hold fee has been processed. Show your OTP at the
            store counter when you arrive.
          </p>
        </motion.div>

        {/* Details card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="glass-card rounded-2xl p-6 space-y-3 text-left"
        >
          {[
            { label: "Amount Paid", value: `₹${(parseFloat(amount) * 1.18).toFixed(2)}` },
            { label: "Payment ID", value: paymentId || "—" },
            { label: "Reservation ID", value: reservationId ? `${reservationId.slice(0, 8)}…` : "—" },
            { label: "Status", value: "Completed ✓" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#525252]">
                {label}
              </span>
              <span className="text-sm font-medium text-white">{value}</span>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Link
            href="/my-reservations"
            id="my-reservations-btn"
            className="btn-gradient flex-1 rounded-xl px-6 py-3 text-sm text-center"
          >
            My Reservations
          </Link>
          {reservationId && (
            <Link
              href={`/checkout?reservation_id=${reservationId}`}
              id="continue-payment-btn"
              className="btn-ghost flex-1 rounded-xl px-6 py-3 text-sm text-center"
            >
              Continue Payment
            </Link>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-[#525252]"
        >
          A confirmation has been logged to your account. Store your Payment ID
          for any refund queries.
        </motion.p>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <div className="spinner-orbital" />
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
