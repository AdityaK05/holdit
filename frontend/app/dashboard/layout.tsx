"use client";

import type { ReactNode } from "react";

/**
 * Legacy dashboard layout — now just a passthrough wrapper.
 * The page.tsx inside redirects to /manager/reservations.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
