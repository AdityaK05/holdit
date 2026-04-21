export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: "customer" | "store_staff" | "admin";
  created_at: string;
  store_id?: string | null;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
  phone: string;
  is_active: boolean;
}

export interface StoreWithDistance extends Store {
  distance_km: number;
  available_qty: number;
}

export interface StoreProfile extends Store {
  description: string;
  hours: Record<string, { open: string; close: string; closed: boolean }>;
  staff_count: number;
  total_products: number;
  total_reservations: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  barcode?: string | null;
  price_paise?: number;
  created_at: string;
}

export interface Inventory {
  id: string;
  store_id: string;
  product_id: string;
  total_qty: number;
  available_qty: number;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  product: Product;
  store_id: string;
  total_qty: number;
  available_qty: number;
  updated_at: string;
}

export interface Reservation {
  id: string;
  user_id: string;
  store_id: string;
  product_id: string;
  status: "pending" | "confirmed" | "rejected" | "completed" | "expired";
  otp: string;
  expires_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  total_amount_paise?: number;
  paid_amount_paise?: number;
  payment_status?: ReservationPaymentStatus;
  created_at: string;
  store: Store;
  product: Product;
}

export type ReservationPaymentStatus = "pending" | "partially_paid" | "fully_paid";

export interface DashboardReservation {
  id: string;
  status: "pending" | "confirmed" | "rejected" | "completed" | "expired";
  otp: string;
  expires_at: string;
  confirmed_at: string | null;
  completed_at?: string | null;
  total_amount_paise?: number;
  paid_amount_paise?: number;
  payment_status?: ReservationPaymentStatus;
  created_at: string;
  user: {
    id: string;
    name: string;
    phone: string;
  };
  product: {
    id: string;
    name: string;
    category: string;
    image_url: string | null;
  };
  store: {
    id: string;
    name: string;
  };
}

export interface DashboardAnalytics {
  todayReservations: number;
  pendingPickups: number;
  completedToday: number;
  avgPickupMinutes: number;
  weeklyTrend: number[]; // 7 days of reservation counts
  topProducts: Array<{ name: string; count: number }>;
  revenueTodayPaise: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentMode = "full" | "partial" | "remaining";

export interface Payment {
  id: string;
  reservation_id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount_paise: number;
  currency: string;
  status: PaymentStatus;
  payment_mode: PaymentMode;
  created_at: string;
  updated_at: string;
}

export interface PaymentOrder {
  reservation_id: string;
  razorpay_order_id: string;
  amount_paise: number;
  currency: string;
  key_id: string;
  payment_id: string;
  payment_mode: PaymentMode;
  reservation_payment_status: ReservationPaymentStatus;
  total_amount_paise: number;
  paid_amount_paise: number;
  outstanding_amount_paise: number;
  is_mock_gateway: boolean;
}

export interface PaymentVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Razorpay checkout options injected into the global rzp instance */
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  theme: { color: string };
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
