"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/manager/reservations");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="spinner-orbital mx-auto" />
        <p className="text-sm text-[#525252]">Redirecting to Manager Portal...</p>
      </div>
    </div>
  );
}
