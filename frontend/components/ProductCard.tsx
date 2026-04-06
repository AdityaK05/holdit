"use client";

import Link from "next/link";

import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const productName = encodeURIComponent(product.name);

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-200/70">
      <div className="relative h-48 overflow-hidden bg-slate-200">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-sm font-medium text-slate-500">
            No image available
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {product.category}
          </span>
          <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
          <p className="min-h-[3rem] text-sm text-slate-600">
            {product.description || "Find this item nearby and reserve it before you leave."}
          </p>
        </div>

        <Link
          href={`/stores?product_id=${product.id}&name=${productName}`}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Find in Store
        </Link>
      </div>
    </article>
  );
}
