"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const productName = encodeURIComponent(product.name);

  return (
    <motion.article
      initial={{ opacity: 0, rotateX: 15, y: 40 }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      style={{ perspective: "1000px" }}
      className="group glass-card overflow-hidden rounded-2xl"
    >
      <div className="relative h-52 overflow-hidden">
        {product.image_url ? (
          <motion.img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12 text-[#1a1a1a]">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="1.5" /><path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        {/* Category badge */}
        <span className="absolute bottom-4 left-4 inline-flex rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(0,0,0,0.7)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#a3a3a3] backdrop-blur-sm">
          {product.category}
        </span>
      </div>

      <div className="space-y-4 p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-bold tracking-tight text-white">{product.name}</h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-[#525252]">
            {product.description || "Find this item nearby and reserve it."}
          </p>
        </div>

        <Link
          href={`/stores?product_id=${product.id}&name=${productName}`}
          className="btn-gradient group/btn inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm"
        >
          Find in Store
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </motion.article>
  );
}
