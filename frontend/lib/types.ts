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
  created_at: string;
  store: Store;
  product: Product;
}

export interface DashboardReservation {
  id: string;
  status: "pending" | "confirmed" | "rejected" | "completed" | "expired";
  otp: string;
  expires_at: string;
  confirmed_at: string | null;
  completed_at?: string | null;
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
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}
