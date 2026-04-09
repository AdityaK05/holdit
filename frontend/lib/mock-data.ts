import type { Product, Store, StoreWithDistance, Reservation, DashboardReservation, InventoryItem, StoreProfile, DashboardAnalytics } from "@/lib/types";

export const mockProducts: Product[] = [
  {
    id: "prod-001",
    name: "Sony WH-1000XM5",
    description: "Industry-leading noise canceling headphones with exceptional sound quality, 30-hour battery life, and ultra-comfortable design.",
    category: "Electronics",
    image_url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop",
    created_at: "2026-03-15T10:00:00Z",
  },
  {
    id: "prod-002",
    name: "Apple AirPods Pro 2",
    description: "Active noise cancellation, adaptive transparency, and personalized spatial audio for an immersive listening experience.",
    category: "Electronics",
    image_url: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=300&fit=crop",
    created_at: "2026-03-14T10:00:00Z",
  },
  {
    id: "prod-003",
    name: "Organic Almond Milk",
    description: "Unsweetened, dairy-free almond milk made from California almonds. Perfect for smoothies and cereals.",
    category: "Groceries",
    image_url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop",
    created_at: "2026-03-13T10:00:00Z",
  },
  {
    id: "prod-004",
    name: "iPhone 16 Pro Case",
    description: "Premium silicone case with MagSafe compatibility. Precision-cut for perfect fit and full port access.",
    category: "Accessories",
    image_url: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=300&fit=crop",
    created_at: "2026-03-12T10:00:00Z",
  },
  {
    id: "prod-005",
    name: "Moleskine Classic Notebook",
    description: "Iconic hardcover notebook with ivory-colored pages, elastic closure, and ribbon bookmark. 240 pages, ruled.",
    category: "Stationery",
    image_url: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=300&fit=crop",
    created_at: "2026-03-11T10:00:00Z",
  },
  {
    id: "prod-006",
    name: "Dyson V15 Detect",
    description: "Powerful cordless vacuum with laser dust detection, LCD screen for real-time particle counts, and up to 60 minutes runtime.",
    category: "Home",
    image_url: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=300&fit=crop",
    created_at: "2026-03-10T10:00:00Z",
  },
  {
    id: "prod-007",
    name: "Levi's 501 Original Jeans",
    description: "The iconic straight fit jean that started it all. 100% cotton denim with signature button fly.",
    category: "Fashion",
    image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop",
    created_at: "2026-03-09T10:00:00Z",
  },
  {
    id: "prod-008",
    name: "Nespresso Vertuo Plus",
    description: "Centrifusion technology brews barista-quality coffee and espresso at the touch of a button. Includes 12 capsule welcome set.",
    category: "Kitchen",
    image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
    created_at: "2026-03-08T10:00:00Z",
  },
  {
    id: "prod-009",
    name: "Nintendo Switch OLED",
    description: "Vivid 7-inch OLED screen, wide adjustable stand, enhanced audio, and 64GB internal storage for gaming anywhere.",
    category: "Gaming",
    image_url: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=300&fit=crop",
    created_at: "2026-03-07T10:00:00Z",
  },
];

export const mockStores: StoreWithDistance[] = [
  {
    id: "store-001",
    name: "TechHub Electronics",
    address: "MG Road, Bengaluru, Karnataka 560001",
    lat: "12.9716",
    lng: "77.5946",
    phone: "+91 98765 43210",
    is_active: true,
    distance_km: 1.2,
    available_qty: 5,
  },
  {
    id: "store-002",
    name: "City Convenience Store",
    address: "Koramangala, Bengaluru, Karnataka 560034",
    lat: "12.9352",
    lng: "77.6245",
    phone: "+91 98765 43211",
    is_active: true,
    distance_km: 3.5,
    available_qty: 2,
  },
  {
    id: "store-003",
    name: "Metro Retail Hub",
    address: "Indiranagar, Bengaluru, Karnataka 560038",
    lat: "12.9784",
    lng: "77.6408",
    phone: "+91 98765 43212",
    is_active: true,
    distance_km: 5.8,
    available_qty: 8,
  },
];

export const mockReservations: Reservation[] = [
  {
    id: "res-001",
    user_id: "user-001",
    store_id: "store-001",
    product_id: "prod-001",
    status: "confirmed",
    otp: "482917",
    expires_at: new Date(Date.now() + 600000).toISOString(),
    confirmed_at: new Date(Date.now() - 120000).toISOString(),
    completed_at: null,
    created_at: new Date(Date.now() - 300000).toISOString(),
    store: {
      id: "store-001",
      name: "TechHub Electronics",
      address: "MG Road, Bengaluru, Karnataka 560001",
      lat: "12.9716",
      lng: "77.5946",
      phone: "+91 98765 43210",
      is_active: true,
    },
    product: {
      id: "prod-001",
      name: "Sony WH-1000XM5",
      description: "Industry-leading noise canceling headphones",
      category: "Electronics",
      image_url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop",
      created_at: "2026-03-15T10:00:00Z",
    },
  },
  {
    id: "res-002",
    user_id: "user-001",
    store_id: "store-002",
    product_id: "prod-003",
    status: "completed",
    otp: "193847",
    expires_at: new Date(Date.now() - 3600000).toISOString(),
    confirmed_at: new Date(Date.now() - 7200000).toISOString(),
    completed_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    store: {
      id: "store-002",
      name: "City Convenience Store",
      address: "Koramangala, Bengaluru, Karnataka 560034",
      lat: "12.9352",
      lng: "77.6245",
      phone: "+91 98765 43211",
      is_active: true,
    },
    product: {
      id: "prod-003",
      name: "Organic Almond Milk",
      description: "Unsweetened, dairy-free almond milk",
      category: "Groceries",
      image_url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop",
      created_at: "2026-03-13T10:00:00Z",
    },
  },
];

// ─── Store Manager Mock Data ───

export const mockDashboardReservations: DashboardReservation[] = [
  {
    id: "dres-001",
    status: "pending",
    otp: "384756",
    expires_at: new Date(Date.now() + 540000).toISOString(),
    confirmed_at: null,
    completed_at: null,
    created_at: new Date(Date.now() - 60000).toISOString(),
    user: { id: "u-101", name: "Priya Sharma", phone: "+91 99887 76655" },
    product: { id: "prod-001", name: "Sony WH-1000XM5", category: "Electronics", image_url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop" },
    store: { id: "store-001", name: "TechHub Electronics" },
  },
  {
    id: "dres-002",
    status: "pending",
    otp: "192837",
    expires_at: new Date(Date.now() + 420000).toISOString(),
    confirmed_at: null,
    completed_at: null,
    created_at: new Date(Date.now() - 180000).toISOString(),
    user: { id: "u-102", name: "Arjun Patel", phone: "+91 88776 65544" },
    product: { id: "prod-004", name: "iPhone 16 Pro Case", category: "Accessories", image_url: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=300&fit=crop" },
    store: { id: "store-001", name: "TechHub Electronics" },
  },
  {
    id: "dres-003",
    status: "pending",
    otp: "564738",
    expires_at: new Date(Date.now() + 300000).toISOString(),
    confirmed_at: null,
    completed_at: null,
    created_at: new Date(Date.now() - 240000).toISOString(),
    user: { id: "u-103", name: "Neha Gupta", phone: "+91 77665 54433" },
    product: { id: "prod-009", name: "Nintendo Switch OLED", category: "Gaming", image_url: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=300&fit=crop" },
    store: { id: "store-001", name: "TechHub Electronics" },
  },
  {
    id: "dres-004",
    status: "confirmed",
    otp: "847291",
    expires_at: new Date(Date.now() + 480000).toISOString(),
    confirmed_at: new Date(Date.now() - 300000).toISOString(),
    completed_at: null,
    created_at: new Date(Date.now() - 600000).toISOString(),
    user: { id: "u-104", name: "Rahul Verma", phone: "+91 66554 43322" },
    product: { id: "prod-002", name: "Apple AirPods Pro 2", category: "Electronics", image_url: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=300&fit=crop" },
    store: { id: "store-001", name: "TechHub Electronics" },
  },
  {
    id: "dres-005",
    status: "confirmed",
    otp: "293847",
    expires_at: new Date(Date.now() + 360000).toISOString(),
    confirmed_at: new Date(Date.now() - 180000).toISOString(),
    completed_at: null,
    created_at: new Date(Date.now() - 900000).toISOString(),
    user: { id: "u-105", name: "Ananya Reddy", phone: "+91 55443 32211" },
    product: { id: "prod-006", name: "Dyson V15 Detect", category: "Home", image_url: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=300&fit=crop" },
    store: { id: "store-001", name: "TechHub Electronics" },
  },
  {
    id: "dres-006",
    status: "completed",
    otp: "738291",
    expires_at: new Date(Date.now() - 1800000).toISOString(),
    confirmed_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: new Date(Date.now() - 1800000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    user: { id: "u-106", name: "Vikram Singh", phone: "+91 44332 21100" },
    product: { id: "prod-005", name: "Moleskine Classic Notebook", category: "Stationery", image_url: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=300&fit=crop" },
    store: { id: "store-001", name: "TechHub Electronics" },
  },
  {
    id: "dres-007",
    status: "completed",
    otp: "102938",
    expires_at: new Date(Date.now() - 3600000).toISOString(),
    confirmed_at: new Date(Date.now() - 5400000).toISOString(),
    completed_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 10800000).toISOString(),
    user: { id: "u-107", name: "Meera Nair", phone: "+91 33221 10099" },
    product: { id: "prod-008", name: "Nespresso Vertuo Plus", category: "Kitchen", image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop" },
    store: { id: "store-001", name: "TechHub Electronics" },
  },
];

export const mockInventory: InventoryItem[] = mockProducts.map((product, i) => ({
  id: `inv-${product.id}`,
  product,
  store_id: "store-001",
  total_qty: [15, 8, 25, 12, 30, 3, 20, 6, 10][i] ?? 10,
  available_qty: [12, 5, 22, 9, 28, 1, 18, 4, 7][i] ?? 8,
  updated_at: new Date(Date.now() - i * 3600000).toISOString(),
}));

export const mockStoreProfile: StoreProfile = {
  id: "store-001",
  name: "TechHub Electronics",
  address: "MG Road, Bengaluru, Karnataka 560001",
  lat: "12.9716",
  lng: "77.5946",
  phone: "+91 98765 43210",
  is_active: true,
  description: "Premium electronics and lifestyle products. Your one-stop destination for cutting-edge technology and everyday essentials in the heart of Bengaluru.",
  hours: {
    monday: { open: "09:00", close: "21:00", closed: false },
    tuesday: { open: "09:00", close: "21:00", closed: false },
    wednesday: { open: "09:00", close: "21:00", closed: false },
    thursday: { open: "09:00", close: "21:00", closed: false },
    friday: { open: "09:00", close: "22:00", closed: false },
    saturday: { open: "10:00", close: "22:00", closed: false },
    sunday: { open: "10:00", close: "20:00", closed: false },
  },
  staff_count: 8,
  total_products: mockProducts.length,
  total_reservations: 1247,
};

export const mockAnalytics: DashboardAnalytics = {
  todayReservations: 23,
  pendingPickups: 3,
  completedToday: 18,
  avgPickupMinutes: 12,
  weeklyTrend: [14, 19, 22, 17, 25, 21, 23],
  topProducts: [
    { name: "Sony WH-1000XM5", count: 8 },
    { name: "Apple AirPods Pro 2", count: 6 },
    { name: "Nintendo Switch OLED", count: 5 },
    { name: "iPhone 16 Pro Case", count: 4 },
    { name: "Nespresso Vertuo Plus", count: 3 },
  ],
};

export function searchMockProducts(query: string): Product[] {
  const lower = query.toLowerCase();
  return mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower) ||
      (p.description && p.description.toLowerCase().includes(lower)),
  );
}

export function getMockDashboardReservations(status?: string): DashboardReservation[] {
  if (!status) return mockDashboardReservations;
  return mockDashboardReservations.filter((r) => r.status === status);
}
