"use client";

import api from "@/lib/api";
import axios from "axios";
import type { ApiResponse, TokenResponse, User } from "@/lib/types";

const ACCESS_TOKEN_KEY = "holdit_access_token";
const REFRESH_TOKEN_KEY = "holdit_refresh_token";
const USER_KEY = "holdit_user";

interface AuthPayload {
  tokens: TokenResponse;
  user: User;
}

const safeGetItem = (key: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures and keep runtime stable.
  }
};

const safeRemoveItem = (key: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage removal failures and keep runtime stable.
  }
};

const persistAuth = ({ tokens, user }: AuthPayload) => {
  safeSetItem(ACCESS_TOKEN_KEY, tokens.access_token);
  safeSetItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  safeSetItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("holdit-auth-changed"));
};

/**
 * Generate a mock auth payload when the backend is unreachable.
 * This lets the frontend work in offline/demo mode so the UI is
 * fully explorable without a running API server.
 */
function mockAuthPayload(name: string, email: string, role: "customer" | "store_staff" = "customer"): AuthPayload {
  const id = `mock-${Date.now()}`;
  return {
    tokens: {
      access_token: `mock_access_${id}`,
      refresh_token: `mock_refresh_${id}`,
      token_type: "bearer",
    },
    user: {
      id,
      name,
      email,
      phone: "",
      role,
      created_at: new Date().toISOString(),
      store_id: role === "store_staff" ? "store-001" : null,
    },
  };
}

/** Returns true when the error is a network-level failure (backend not running). */
function isNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  try {
    const response = await api.post<ApiResponse<AuthPayload>>("/auth/login", {
      email,
      password,
    });

    persistAuth(response.data.data);
    return response.data.data;
  } catch (err) {
    if (isNetworkError(err)) {
      // Backend unreachable — fall back to mock auth for demo purposes
      const payload = mockAuthPayload(email.split("@")[0] || "User", email);
      persistAuth(payload);
      return payload;
    }
    throw err;
  }
}

export async function register(
  name: string,
  phone: string,
  email: string,
  password: string,
): Promise<AuthPayload> {
  try {
    const response = await api.post<ApiResponse<AuthPayload>>("/auth/register", {
      name,
      phone,
      email,
      password,
    });

    persistAuth(response.data.data);
    return response.data.data;
  } catch (err) {
    if (isNetworkError(err)) {
      // Backend unreachable — fall back to mock auth for demo purposes
      const payload = mockAuthPayload(name, email);
      persistAuth(payload);
      return payload;
    }
    throw err;
  }
}

/**
 * Quick-login as a mock store staff member.
 * Used by the "Demo as Store Manager" button on the login page.
 */
export function loginAsMockStaff(): AuthPayload {
  const payload = mockAuthPayload("Store Manager", "manager@techhub.demo", "store_staff");
  persistAuth(payload);
  return payload;
}

export function logout() {
  safeRemoveItem(ACCESS_TOKEN_KEY);
  safeRemoveItem(REFRESH_TOKEN_KEY);
  safeRemoveItem(USER_KEY);
  window.dispatchEvent(new Event("holdit-auth-changed"));
  window.location.href = "/login";
}

export function getUser(): User | null {
  const rawUser = safeGetItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    safeRemoveItem(USER_KEY);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(safeGetItem(ACCESS_TOKEN_KEY));
}

export function getRole(): string | null {
  return getUser()?.role ?? null;
}
