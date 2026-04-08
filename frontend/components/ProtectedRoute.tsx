"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getRole, isAuthenticated } from "@/lib/auth";

interface ProtectedRouteProps { children: ReactNode; requiredRole?: string; }

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const [authState, setAuthState] = useState<"checking" | "allowed" | "redirecting">("checking");

  useEffect(() => {
    let timer: number | undefined;
    const navigate = (path: string) => {
      router.replace(path);
      timer = window.setTimeout(() => { if (window.location.pathname !== path) window.location.replace(path); }, 150);
    };
    const auth = isAuthenticated();
    if (!auth) { setAuthState("redirecting"); navigate("/login"); return () => { if (timer) window.clearTimeout(timer); }; }
    if (requiredRole && getRole() !== requiredRole) { setAuthState("redirecting"); navigate("/"); return () => { if (timer) window.clearTimeout(timer); }; }
    setAuthState("allowed");
    return () => { if (timer) window.clearTimeout(timer); };
  }, [requiredRole, router]);

  if (authState === "allowed") return <>{children}</>;
  if (authState === "redirecting") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-center">
        <div className="space-y-3">
          <div className="spinner-orbital mx-auto" />
          <p className="text-sm text-[#525252]">Redirecting...</p>
        </div>
      </div>
    );
  }
  return <div className="flex min-h-[40vh] items-center justify-center"><div className="spinner-orbital" /></div>;
}
