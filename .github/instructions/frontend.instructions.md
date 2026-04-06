---
description: "Frontend development guidance for Next.js TypeScript React components, hooks, API calls, and styling"
applyTo: "frontend/**"
---

# Frontend Development Guide (Next.js/TypeScript)

## Project Structure

HoldIt uses Next.js 14 with the App Router:

```
frontend/
  app/
    layout.tsx           # Root layout
    page.tsx             # Home page
    dashboard/
      layout.tsx         # Dashboard section layout
      page.tsx           # Dashboard page
    login/page.tsx       # Login page
    reserve/page.tsx     # Product reservation flow
  components/            # Reusable React components
    ProductCard.tsx
    ReservationCard.tsx
  lib/
    api.ts               # Axios HTTP client
    auth.ts              # Auth utilities
    types.ts             # TypeScript interfaces
```

---

## Pages & Layouts

### Layout Files (Next.js)
Every folder can have `layout.tsx` which wraps child pages:

```tsx
// app/dashboard/layout.tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="dashboard-container">
        <nav>Dashboard Nav</nav>
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
```

### Page Components
```tsx
// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await api.get("/reservations/");
        setReservations(res.data.data);
      } catch (error) {
        console.error("Failed to fetch:", error);
      }
    };
    fetchReservations();
  }, []);

  return (
    <div>
      {reservations.map((r) => (
        <ReservationCard key={r.id} reservation={r} />
      ))}
    </div>
  );
}
```

### Key Rules
- **"use client"**: Add at the top of files that use hooks or event listeners
- **Server Components**: Default (no "use client") for static pages, data fetching
- **Layouts**: Wrap common UI sections (navigation, sidebar)

---

## Components (Reusable)

### Pattern: Functional Component with Types
```tsx
// components/ProductCard.tsx
"use client";

import type { Product } from "@/lib/types";
import { FC } from "react";

interface ProductCardProps {
  product: Product;
  onReserve: (productId: string) => void;
  isLoading?: boolean;
}

const ProductCard: FC<ProductCardProps> = ({ product, onReserve, isLoading = false }) => {
  const handleClick = () => onReserve(product.id);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-xl font-bold">{product.name}</h3>
      <p className="text-gray-600">{product.description}</p>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4 disabled:bg-gray-400"
      >
        {isLoading ? "Reserving..." : "Reserve"}
      </button>
    </div>
  );
};

export default ProductCard;
```

### Key Rules
- **Typing**: Use `interface Props`, import `FC` from React
- **Export**: Default export for components
- **Props drilling**: Keep to 2-3 levels; use Context for deeply nested state
- **Children**: Always type: `children: React.ReactNode`

---

## Hooks & State Management

### Pattern: useEffect for Data Fetching
```tsx
"use client";

import { useEffect, useState } from "react";
import type { Store } from "@/lib/types";

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const res = await api.get("/stores/");
        setStores(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load stores");
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []); // Empty dependency = run once on mount

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </div>
  );
}
```

### Pattern: Custom Hook
```tsx
// hooks/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("holdit_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("holdit_access_token");
    localStorage.removeItem("holdit_refresh_token");
    localStorage.removeItem("holdit_user");
    setUser(null);
    window.location.href = "/login";
  };

  return { user, loading, logout };
}
```

### Key Rules
- **Type state**: `useState<T>(initialValue)`
- **Dependencies**: Empty array `[]` for once-on-mount, include values that trigger re-fetch
- **Cleanup**: Return cleanup function from useEffect if needed
- **Custom hooks**: Prefix with `use`, return object with all needed state/functions

---

## API Calls (Axios Client)

### Configured Client in `lib/api.ts`
```typescript
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  timeout: 10000,
});

// Auto-inject authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("holdit_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("holdit_refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            { refresh_token: refreshToken }
          );
          localStorage.setItem("holdit_access_token", res.data.data.access_token);
          // Retry original request with new token
          return api(error.config);
        } catch {}
      }
      // If refresh fails, redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export { api };
```

### Usage Examples
```tsx
// GET with query params
const res = await api.get("/stores", { params: { page: 1, limit: 10 } });

// POST with data
const res = await api.post("/reservations", {
  product_id: "123",
  store_id: "456"
});

// PUT (update)
await api.put(`/reservations/${id}`, { status: "CONFIRMED" });

// DELETE
await api.delete(`/reservations/${id}`);
```

### Key Rules
- **Always use `api`**: Don't use raw axios; client auto-injects auth tokens
- **Error handling**: Check `error.response?.status` and `error.response?.data?.message`
- **Typing**: Type API responses using `lib/types.ts` interfaces
- **No hardcoded URLs**: Use `NEXT_PUBLIC_API_URL` environment variable

---

## TypeScript Types

### `lib/types.ts` (Type Definitions)
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "CUSTOMER" | "STORE_STAFF" | "ADMIN";
  store_id?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  created_at: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  location: { lat: number; lng: number };
  is_active: boolean;
}

export interface Reservation {
  id: string;
  user_id: string;
  product_id: string;
  store_id: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "COMPLETED" | "EXPIRED";
  otp: string;
  expires_at: string;
}
```

### Key Rules
- **Import types correctly**: `import type { User }` vs `import { User }`
- **Union types**: Use `"OPTION1" | "OPTION2"` for enums
- **Interfaces > Types**: Prefer interfaces for extensibility
- **Optional fields**: Use `field?: Type` for optional properties

---

## Styling (Tailwind CSS)

HoldIt uses **Tailwind CSS** (no UI component library):

```tsx
const ProductCard = ({ product }: { product: Product }) => (
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
    <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
    <p className="text-gray-600 mb-4">{product.description}</p>
    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
      Reserve
    </button>
  </div>
);
```

### Key Classes
- **Spacing**: `p-4` (padding), `m-2` (margin), `gap-4` (flex gap)
- **Typography**: `text-lg` (size), `font-bold` (weight), `text-gray-600` (color)
- **Layout**: `flex`, `grid`, `block`, `absolute`, `fixed`
- **States**: `hover:`, `focus:`, `disabled:`, `active:`
- **Responsive**: `md:`, `lg:`, `xl:` breakpoints

---

## Authentication Flow

### Login Page Pattern
```tsx
"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("holdit_access_token", res.data.data.access_token);
      localStorage.setItem("holdit_refresh_token", res.data.data.refresh_token);
      localStorage.setItem("holdit_user", JSON.stringify(res.data.data.user));
      
      // Notify other tabs
      window.dispatchEvent(new Event("holdit-auth-changed"));
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-sm mx-auto p-6">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 border rounded mb-4"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-2 border rounded mb-4"
        required
      />
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        Sign In
      </button>
    </form>
  );
}
```

### ProtectedRoute Wrapper
```tsx
// components/ProtectedRoute.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("holdit_access_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuth(true);
    }

    const handleAuthChange = () => {
      const newToken = localStorage.getItem("holdit_access_token");
      if (!newToken) {
        router.push("/login");
      }
    };

    window.addEventListener("holdit-auth-changed", handleAuthChange);
    return () => window.removeEventListener("holdit-auth-changed", handleAuthChange);
  }, [router]);

  return isAuth ? <>{children}</> : null;
}
```

### Key Rules
- **Token storage**: Keep in `localStorage` with `holdit_` prefix
- **Auto-refresh**: Handled by axios interceptor; transparent to components
- **Cross-tab sync**: Use `window.dispatchEvent(new Event("holdit-auth-changed"))`
- **Protected pages**: Wrap layouts with `<ProtectedRoute>`

---

## Environment Variables (Frontend)

```bash
# .env.local (local development; never commit secrets)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_GOOGLE_MAPS_KEY=...
```

**Note**: Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## Development Workflow

```bash
npm install          # Install dependencies once
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # TypeScript check
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ReferenceError: localStorage is not defined` | SSR accessing browser APIs | Wrap in `useEffect` or use `"use client"` |
| `Type 'never' is not assignable to type 'T'` | State type not properly inferred | Explicitly type: `useState<User \| null>(null)` |
| `401 Unauthorized`, redirects to login | Access token expired | Axios interceptor auto-refreshes, page redirects if no refresh token |
| `NEXT_PUBLIC_API_URL is undefined` | Env var not set | Add `NEXT_PUBLIC_API_URL` to `.env.local` |
| `Cannot find module "@/lib/api"` | Path alias misconfigured | Check `tsconfig.json` has `"@/*": ["./"]` |
