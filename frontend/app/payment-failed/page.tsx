"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";

function FailedContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("store_id") ?? "";
  const productId = searchParams.get("product_id") ?? "";
  const reservationId = searchParams.get("reservation_id") ?? "";
  const amount = searchParams.get("amount") ?? "0";
  const reason = searchParams.get("reason") ?? "The payment was cancelled or declined.";

  const retryUrl = `/checkout?store_id=${storeId}&product_id=${productId}&reservation_id=${reservationId}&amount=${amount}`;

  return (
    <main className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg space-y-8 text-center">

        {/* Error icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full
                     border border-[rgba(255,255,255,0.1)]
                     bg-gradient-to-br from-white/5 to-white/0
                     shadow-[0_0_60px_rgba(255,255,255,0.04)]"
        >
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="h-12 w-12 text-[#a3a3a3]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </motion.svg>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-white">
            Payment Failed
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#525252]">
            {reason}
          </p>
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="glass-card rounded-2xl p-6 space-y-4 text-left"
        >
          <p className="text-sm font-semibold text-white">What to do next</p>
          <ul className="space-y-2 text-sm text-[#525252]">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#525252] shrink-0" />
              Ensure your card has sufficient funds or try a different payment method.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#525252] shrink-0" />
              Your reservation is still held for a few minutes — retry payment to secure it.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#525252] shrink-0" />
              No amount has been deducted from your account.
            </li>
          </ul>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Link
            href={retryUrl}
            id="retry-payment-btn"
            className="btn-gradient flex-1 rounded-xl px-6 py-3 text-sm text-center"
          >
            Retry Payment
          </Link>
          <Link
            href="/"
            id="browse-products-btn"
            className="btn-ghost flex-1 rounded-xl px-6 py-3 text-sm text-center"
          >
            Browse Products
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <main className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <div className="spinner-orbital" />
      </main>
    }>
      <FailedContent />
    </Suspense>
  );
}
