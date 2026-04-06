"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { getRole, isAuthenticated } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [authState, setAuthState] = useState<"checking" | "allowed" | "redirecting">(
    "checking",
  );

  useEffect(() => {
    let fallbackRedirectTimer: number | undefined;

    const navigate = (path: string) => {
      router.replace(path);

      if (typeof window !== "undefined") {
        fallbackRedirectTimer = window.setTimeout(() => {
          if (window.location.pathname !== path) {
            window.location.replace(path);
          }
        }, 150);
      }
    };

    const authenticated = isAuthenticated();

    if (!authenticated) {
      setAuthState("redirecting");
      navigate("/login");
      return () => {
        if (fallbackRedirectTimer !== undefined) {
          window.clearTimeout(fallbackRedirectTimer);
        }
      };
    }

    if (requiredRole && getRole() !== requiredRole) {
      setAuthState("redirecting");
      navigate("/");
      return () => {
        if (fallbackRedirectTimer !== undefined) {
          window.clearTimeout(fallbackRedirectTimer);
        }
      };
    }

    setAuthState("allowed");

    return () => {
      if (fallbackRedirectTimer !== undefined) {
        window.clearTimeout(fallbackRedirectTimer);
      }
    };
  }, [requiredRole, router]);

  if (authState === "allowed") {
    return <>{children}</>;
  }

  if (authState === "redirecting") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-center">
        <p className="text-sm text-slate-600">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
    </div>
  );
}
