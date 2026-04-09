"use client";

import type { ReactNode } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ManagerSidebar from "@/components/manager/ManagerSidebar";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="store_staff">
      <div className="flex min-h-screen">
        <ManagerSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
