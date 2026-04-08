"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import api from "@/lib/api";
import { mockProducts, searchMockProducts } from "@/lib/mock-data";
import type { ApiResponse, Product } from "@/lib/types";

function ProductSkeleton() {
  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="h-52 skeleton-shimmer" />
      <div className="space-y-3 p-6">
        <div className="h-4 w-20 rounded skeleton-shimmer" />
        <div className="h-6 w-2/3 rounded skeleton-shimmer" />
        <div className="h-4 w-full rounded skeleton-shimmer" />
        <div className="h-11 w-full rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(() => searchParams.get("q")?.trim() ?? "", [searchParams]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    if (query.length < 2) {
      // Show all mock products if no query
      setProducts(query === "" ? mockProducts : []);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get<ApiResponse<{ products: Product[] }>>(`/products?q=${encodeURIComponent(query)}`);
      setProducts(response.data.data.products);
    } catch (err) {
      // Fallback to mock data if backend is down
      if (axios.isAxiosError(err) && !err.response) {
        const results = searchMockProducts(query);
        setProducts(results);
        setLoading(false);
        return;
      }
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Something went wrong");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProducts(); }, [query]);

  return (
    <main className="min-h-[calc(100vh-73px)] px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
          <div className="overflow-hidden">
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#525252]">Search</p>
              <h1 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
                Find products
              </h1>
            </motion.div>
          </div>
          <div className="max-w-3xl">
            <SearchBar defaultValue={query} loading={loading}
              onSearch={(v) => router.push(`/search?q=${encodeURIComponent(v)}`)} />
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6">
            <p className="text-sm font-medium text-[#a3a3a3]">{error}</p>
            <button type="button" onClick={() => void loadProducts()} className="btn-gradient mt-4 rounded-xl px-4 py-2 text-sm">Retry</button>
          </motion.div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-16 text-center">
            <h2 className="text-2xl font-bold text-white">No results</h2>
            <p className="mt-3 text-sm text-[#525252]">Try a broader search term.</p>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="min-h-[calc(100vh-73px)] px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      </main>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
