"use client";

import api from "@/lib/api";
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

export async function login(email: string, password: string): Promise<AuthPayload> {
  const response = await api.post<ApiResponse<AuthPayload>>("/auth/login", {
    email,
    password,
  });

  persistAuth(response.data.data);
  return response.data.data;
}

export async function register(
  name: string,
  phone: string,
  email: string,
  password: string,
): Promise<AuthPayload> {
  const response = await api.post<ApiResponse<AuthPayload>>("/auth/register", {
    name,
    phone,
    email,
    password,
  });

  persistAuth(response.data.data);
  return response.data.data;
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
