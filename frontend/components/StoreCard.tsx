"use client";

import Link from "next/link";

import type { StoreWithDistance } from "@/lib/types";

interface StoreCardProps {
  store: StoreWithDistance;
  productId: string;
  onSelect: () => void;
  selected?: boolean;
}

export default function StoreCard({
  store,
  productId,
  onSelect,
  selected = false,
}: StoreCardProps) {
  const availabilityClass =
    store.available_qty > 2
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";

  return (
    <article
      className={`rounded-3xl border bg-white p-5 shadow-sm transition ${
        selected
          ? "border-blue-500 shadow-lg shadow-blue-100"
          : "border-slate-200 hover:border-blue-200 hover:shadow-md"
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{store.name}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">{store.address}</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {store.distance_km.toFixed(1)} km away
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${availabilityClass}`}>
              {store.available_qty} in stock
            </span>
          </div>
        </div>
      </button>

      <Link
        href={`/reserve?store_id=${store.id}&product_id=${productId}`}
        className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Reserve Here
      </Link>
    </article>
  );
}
