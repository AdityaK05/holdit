"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import RazorpayButton from "@/components/RazorpayButton";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import { mockProducts, mockStores } from "@/lib/mock-data";
import type {
  ApiResponse,
  Payment,
  PaymentMode,
  PaymentOrder,
  PaymentVerifyPayload,
  Product,
  RazorpayPaymentResponse,
  Reservation,
  Store,
} from "@/lib/types";

function CheckoutSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-8">
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <div className="h-52 rounded-2xl skeleton-shimmer" />
        <div className="space-y-4">
          <div className="h-4 w-28 rounded skeleton-shimmer" />
          <div className="h-8 w-2/3 rounded skeleton-shimmer" />
          <div className="h-4 w-full rounded skeleton-shimmer" />
          <div className="h-20 w-full rounded-xl skeleton-shimmer" />
          <div className="h-12 w-full rounded-xl skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeIdParam = searchParams.get("store_id") ?? "";
  const productIdParam = searchParams.get("product_id") ?? "";
  const reservationId = searchParams.get("reservation_id") ?? "";

  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [step, setStep] = useState<"review" | "processing" | "done">("review");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("full");
  const [partialAmount, setPartialAmount] = useState("0");

  useEffect(() => {
    const loadDetails = async () => {
      if (!reservationId) {
        setError("Missing checkout details");
        setLoading(false);
        return;
      }

      try {
        const rRes = await api.get<ApiResponse<{ reservation: Reservation }>>(`/reservations/${reservationId}`);
        const resolvedReservation = rRes.data.data.reservation;
        const resolvedStoreId = storeIdParam || resolvedReservation.store_id;
        const resolvedProductId = productIdParam || resolvedReservation.product_id;

        const [pRes, sRes] = await Promise.all([
          api.get<ApiResponse<{ product: Product }>>(`/products/${resolvedProductId}`),
          api.get<ApiResponse<{ store: Store }>>(`/stores/${resolvedStoreId}`),
        ]);

        setProduct(pRes.data.data.product);
        setStore(sRes.data.data.store);
        setReservation(resolvedReservation);

        const total = (resolvedReservation.total_amount_paise ?? 0) / 100;
        const paid = (resolvedReservation.paid_amount_paise ?? 0) / 100;
        const remaining = Math.max(total - paid, 0);

        if (paid > 0 && remaining > 0) {
          setPaymentMode("remaining");
        } else {
          setPaymentMode("full");
        }

        const suggestedPartial = remaining > 0 ? Math.min(Math.max(total * 0.3, 10), remaining - 1 > 0 ? remaining - 1 : remaining) : 0;
        setPartialAmount(suggestedPartial > 0 ? suggestedPartial.toFixed(2) : "0");
      } catch (err) {
        if (axios.isAxiosError(err) && !err.response) {
          const mp = mockProducts.find((p) => p.id === productIdParam) ?? mockProducts[0];
          const ms = mockStores.find((s) => s.id === storeIdParam) ?? mockStores[0];
          setProduct(mp);
          setStore({ id: ms.id, name: ms.name, address: ms.address, lat: ms.lat, lng: ms.lng, phone: ms.phone, is_active: true });
          setReservation({
            id: reservationId,
            user_id: "mock-user",
            store_id: ms.id,
            product_id: mp.id,
            status: "pending",
            otp: "000000",
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            confirmed_at: null,
            completed_at: null,
            created_at: new Date().toISOString(),
            total_amount_paise: mp.price_paise ?? 9900,
            paid_amount_paise: 0,
            payment_status: "pending",
            store: { id: ms.id, name: ms.name, address: ms.address, lat: ms.lat, lng: ms.lng, phone: ms.phone, is_active: true },
            product: mp,
          });
        } else {
          setError("Failed to load details");
        }
      } finally {
        setLoading(false);
      }
    };
    void loadDetails();
  }, [reservationId, productIdParam, storeIdParam]);

  const storeId = store?.id ?? reservation?.store_id ?? storeIdParam;
  const productId = product?.id ?? reservation?.product_id ?? productIdParam;

  const totalAmount = ((reservation?.total_amount_paise ?? product?.price_paise ?? 0) / 100) || 0;
  const paidAmount = (reservation?.paid_amount_paise ?? 0) / 100;
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);
  const isPartiallyPaid = paidAmount > 0 && remainingAmount > 0;
  const isFullyPaid = remainingAmount <= 0;

  const amountToPay = (() => {
    if (paymentMode === "partial") {
      const parsed = Number(partialAmount);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return remainingAmount;
  })();

  const createOrder = async () => {
    setPaying(true);
    setError("");
    if (!reservationId) {
      router.push(`/reserve?store_id=${storeId}&product_id=${productId}`);
      setPaying(false);
      return;
    }

    if (isFullyPaid) {
      setError("This reservation is already fully paid.");
      setPaying(false);
      return;
    }

    if (paymentMode === "partial") {
      if (amountToPay <= 0) {
        setError("Enter a valid partial amount.");
        setPaying(false);
        return;
      }
      if (amountToPay >= remainingAmount) {
        setError("Partial amount must be less than remaining amount.");
        setPaying(false);
        return;
      }
    }

    try {
      const res = await api.post<ApiResponse<{ order: PaymentOrder }>>(
        "/payments/create-order",
        {
          reservation_id: reservationId,
          payment_mode: paymentMode,
          amount: paymentMode === "partial" ? amountToPay : undefined,
        },
      );
      setOrder(res.data.data.order);
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setOrder({
          reservation_id: reservationId,
          razorpay_order_id: `order_demo_${Date.now()}`,
          amount_paise: Math.round(amountToPay * 100),
          currency: "INR",
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "rzp_test_demo",
          payment_id: `pay_demo_${Date.now()}`,
          payment_mode: paymentMode,
          reservation_payment_status: reservation?.payment_status ?? "pending",
          total_amount_paise: reservation?.total_amount_paise ?? Math.round(totalAmount * 100),
          paid_amount_paise: reservation?.paid_amount_paise ?? Math.round(paidAmount * 100),
          outstanding_amount_paise: Math.round(remainingAmount * 100),
          is_mock_gateway: true,
        });
      } else {
        setError(axios.isAxiosError(err) ? (err.response?.data?.message ?? "Payment init failed") : "Payment init failed");
      }
    } finally {
      setPaying(false);
    }
  };

  const verifyAndRedirect = async (verifyPayload: PaymentVerifyPayload) => {
    setStep("processing");

    try {
      const res = await api.post<ApiResponse<{ payment: Payment }>>(
        "/payments/verify",
        verifyPayload,
      );
      const payment = res.data.data.payment;
      setStep("done");
      router.push(
        `/payment-success?payment_id=${payment.id}&reservation_id=${payment.reservation_id}&amount=${payment.amount_paise / 100}`,
      );
    } catch (err) {
      setStep("done");
      if (axios.isAxiosError(err)) {
        const reason = encodeURIComponent(err.response?.data?.message ?? "Verification failed");
        router.push(`/payment-failed?store_id=${storeId}&product_id=${productId}&reservation_id=${reservationId}&amount=${amountToPay}&reason=${reason}`);
      } else {
        router.push(`/payment-failed?store_id=${storeId}&product_id=${productId}&reservation_id=${reservationId}&amount=${amountToPay}`);
      }
    }
  };

  const handlePaymentSuccess = async (response: RazorpayPaymentResponse) => {
    await verifyAndRedirect({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    });
  };

  const handleMockPayment = async () => {
    if (!order) {
      return;
    }

    await verifyAndRedirect({
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: `mock_pay_${Date.now()}`,
      razorpay_signature: "mock_signature",
    });
  };

  const handleDismiss = () => {
    setPaying(false);
    setOrder(null);
    setStep("review");
  };

  const user = getUser();

  return (
    <ProtectedRoute>
      <main className="min-h-[calc(100vh-73px)] px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#525252]">
              Secure checkout
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-white">
              Confirm & Pay
            </h1>
          </motion.div>

          {loading && <CheckoutSkeleton />}

          {!loading && error && (
            <div className="glass-card rounded-2xl p-6">
              <p className="text-sm text-[#a3a3a3]">{error}</p>
              <Link href="/" className="btn-gradient mt-4 inline-flex rounded-xl px-4 py-2 text-sm">
                Go home
              </Link>
            </div>
          )}

          {!loading && product && store && step !== "processing" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <div className="grid md:grid-cols-[220px_1fr]">
                {/* Product image */}
                <div className="relative overflow-hidden md:h-full h-48">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover grayscale opacity-80"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#0a0a0a]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12 text-[#1a1a1a]">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111111]/50 hidden md:block" />
                </div>

                {/* Details */}
                <div className="p-8 space-y-6">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#525252]">
                      {product.category}
                    </span>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-white">
                      {product.name}
                    </h2>
                    {product.description && (
                      <p className="mt-2 text-sm leading-6 text-[#525252]">{product.description}</p>
                    )}
                  </div>

                  {/* Store info */}
                  <div className="glass-surface rounded-xl p-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-[#525252] shrink-0">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      </svg>
                      <p className="text-sm font-semibold text-white">{store.name}</p>
                    </div>
                    <p className="pl-6 text-sm text-[#525252]">{store.address}</p>
                  </div>

                  {/* Amount breakdown */}
                  <div className="rounded-xl border border-[rgba(255,255,255,0.08)] p-4 space-y-2">
                    <div className="flex justify-between text-sm text-[#a3a3a3]">
                      <span>Total Product Price</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#a3a3a3]">
                      <span>Already Paid</span>
                      <span>₹{paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-[rgba(255,255,255,0.06)] pt-2 flex justify-between font-bold text-white">
                      <span>Outstanding</span>
                      <span>₹{remainingAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {isFullyPaid ? (
                    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4 text-sm text-white">
                      This reservation is fully paid. You can track it in My Reservations.
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-[rgba(255,255,255,0.08)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#525252]">Payment option</p>

                      {!isPartiallyPaid && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMode("full")}
                            className={`rounded-xl border px-4 py-3 text-left text-sm ${paymentMode === "full" ? "border-white bg-[rgba(255,255,255,0.08)] text-white" : "border-[rgba(255,255,255,0.08)] text-[#a3a3a3]"}`}
                          >
                            Full Payment
                            <div className="mt-1 font-semibold">₹{remainingAmount.toFixed(2)}</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMode("partial")}
                            className={`rounded-xl border px-4 py-3 text-left text-sm ${paymentMode === "partial" ? "border-white bg-[rgba(255,255,255,0.08)] text-white" : "border-[rgba(255,255,255,0.08)] text-[#a3a3a3]"}`}
                          >
                            Token / Partial
                            <div className="mt-1 font-semibold">Pay less now, remaining later</div>
                          </button>
                        </div>
                      )}

                      {isPartiallyPaid && (
                        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-white">
                          Partial payment detected. Pay remaining balance to complete purchase.
                        </div>
                      )}

                      {paymentMode === "partial" && !isPartiallyPaid && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[#525252]">Amount to pay now (INR)</label>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(1, remainingAmount - 0.01)}
                            step="0.01"
                            value={partialAmount}
                            onChange={(event) => setPartialAmount(event.target.value)}
                            className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                          />
                        </div>
                      )}

                      <div className="text-sm text-[#a3a3a3]">
                        Paying now: <span className="font-semibold text-white">₹{amountToPay.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-sm text-[#a3a3a3]">{error}</p>}

                  {!isFullyPaid && !order ? (
                    <button
                      id="checkout-init-btn"
                      type="button"
                      disabled={paying}
                      onClick={() => void createOrder()}
                      className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm"
                    >
                      {paying
                        ? <><span className="spinner-orbital-sm" /> Initialising payment…</>
                        : <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                              <rect x="1" y="4" width="22" height="16" rx="2" />
                              <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                            Continue to Payment
                          </>
                      }
                    </button>
                  ) : null}

                  {!isFullyPaid && order && !order.is_mock_gateway && (
                    <RazorpayButton
                      options={{
                        key: order.key_id,
                        amount: order.amount_paise,
                        currency: order.currency,
                        order_id: order.razorpay_order_id,
                        name: "HoldIt",
                        description: `Reserve: ${product.name} at ${store.name}`,
                        theme: { color: "#ffffff" },
                        prefill: {
                          name: user?.name ?? "",
                          email: user?.email ?? "",
                        },
                        handler: handlePaymentSuccess,
                      }}
                      onSuccess={handlePaymentSuccess}
                      onDismiss={handleDismiss}
                      className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Open Secure Payment
                    </RazorpayButton>
                  )}

                  {!isFullyPaid && order?.is_mock_gateway && (
                    <button
                      type="button"
                      onClick={() => void handleMockPayment()}
                      className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm"
                    >
                      Complete Simulated Payment
                    </button>
                  )}

                  <div className="flex items-center gap-2 text-xs text-[#525252]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Payments are verified server-side and synced to reservation status in real time.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-16 text-center"
            >
              <div className="mx-auto mb-6 spinner-orbital" style={{ width: 48, height: 48 }} />
              <p className="text-sm font-medium text-white">Verifying payment…</p>
              <p className="mt-2 text-xs text-[#525252]">Do not close this tab</p>
            </motion.div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-[calc(100vh-73px)] px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl"><CheckoutSkeleton /></div>
      </main>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
