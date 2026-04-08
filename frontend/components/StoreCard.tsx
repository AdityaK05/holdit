"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { StoreWithDistance } from "@/lib/types";

interface StoreCardProps {
  store: StoreWithDistance;
  productId: string;
  onSelect: () => void;
  selected?: boolean;
  index?: number;
}

export default function StoreCard({ store, productId, onSelect, selected = false, index = 0 }: StoreCardProps) {
  const isLowStock = store.available_qty <= 2;

  return (
    <motion.article
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
      className={`glass-card overflow-hidden rounded-2xl transition-all duration-500 ${
        selected ? "border-[rgba(255,255,255,0.25)] glow-accent" : "hover:border-[rgba(255,255,255,0.12)]"
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full p-6 text-left">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">{store.name}</h3>
              <p className="mt-1.5 text-sm leading-6 text-[#525252]">{store.address}</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-semibold text-[#a3a3a3]">
              {store.distance_km.toFixed(1)} km
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 text-sm font-semibold ${isLowStock ? "text-[#a3a3a3]" : "text-white"}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${isLowStock ? "bg-[#a3a3a3] animate-pulse" : "bg-white"}`} />
              {store.available_qty} in stock
            </span>
          </div>
        </div>
      </button>
      <div className="px-6 pb-6">
        <Link href={`/reserve?store_id=${store.id}&product_id=${productId}`}
          className="btn-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm">
          Reserve Here
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </Link>
      </div>
    </motion.article>
  );
}
