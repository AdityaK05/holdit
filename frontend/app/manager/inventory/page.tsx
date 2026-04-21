"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import api from "@/lib/api";
import type { InventoryItem } from "@/lib/types";

function StockBadge({ available, total }: { available: number; total: number }) {
  const pct = total > 0 ? available / total : 0;
  let color = "text-white";
  let label = "In Stock";
  if (available === 0) { color = "text-[#525252]"; label = "Out of Stock"; }
  else if (pct <= 0.2) { color = "text-[#a3a3a3]"; label = "Low Stock"; }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${available === 0 ? "bg-[#525252]" : pct <= 0.2 ? "bg-[#a3a3a3] animate-pulse" : "bg-white"}`} />
      {label}
    </span>
  );
}

export default function ManagerInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scanBarcode, setScanBarcode] = useState("");
  const [scanQty, setScanQty] = useState(1);
  const [scanName, setScanName] = useState("");
  const [scanCategory, setScanCategory] = useState("");
  const [scanPrice, setScanPrice] = useState("");
  const [scanDescription, setScanDescription] = useState("");
  const [submittingScan, setSubmittingScan] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: "success" | "error" }>>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const loadInventory = async () => {
    try {
      if (loading) {
        setLoading(true);
      }
      setError("");
      const response = await api.get<{ success: boolean; data: { items: InventoryItem[] }; message: string }>(
        "/inventory/store-items",
      );
      setInventory(response.data.data.items);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Failed to load inventory");
      } else {
        setError("Failed to load inventory");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();

    const interval = window.setInterval(() => {
      void loadInventory();
    }, 8000);
    return () => window.clearInterval(interval);
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(inventory.map((i) => i.product.category));
    return ["all", ...Array.from(cats).sort()];
  }, [inventory]);

  const filtered = useMemo(() => {
    let items = inventory;
    if (categoryFilter !== "all") {
      items = items.filter((i) => i.product.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) =>
        i.product.name.toLowerCase().includes(q) ||
        i.product.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [inventory, categoryFilter, searchQuery]);

  const handleScanSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!scanBarcode.trim()) {
      showToast("Barcode is required", "error");
      return;
    }

    const payload: {
      barcode: string;
      quantity: number;
      name?: string;
      category?: string;
      description?: string;
      price_paise?: number;
    } = {
      barcode: scanBarcode.trim(),
      quantity: Math.max(1, scanQty),
    };

    if (scanName.trim()) {
      payload.name = scanName.trim();
    }
    if (scanCategory.trim()) {
      payload.category = scanCategory.trim();
    }
    if (scanDescription.trim()) {
      payload.description = scanDescription.trim();
    }
    if (scanPrice.trim()) {
      const parsedPrice = Number(scanPrice);
      if (Number.isFinite(parsedPrice) && parsedPrice >= 0) {
        payload.price_paise = Math.round(parsedPrice * 100);
      }
    }

    setSubmittingScan(true);
    try {
      await api.post("/inventory/scan", payload);
      showToast("Inventory updated from barcode scan", "success");
      setScanBarcode("");
      setScanQty(1);
      setScanName("");
      setScanCategory("");
      setScanPrice("");
      setScanDescription("");
      await loadInventory();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast(err.response?.data?.message ?? "Failed to process barcode", "error");
      } else {
        showToast("Failed to process barcode", "error");
      }
    } finally {
      setSubmittingScan(false);
    }
  };

  const totalProducts = inventory.length;
  const lowStock = inventory.filter((i) => i.available_qty > 0 && i.available_qty / i.total_qty <= 0.2).length;
  const outOfStock = inventory.filter((i) => i.available_qty === 0).length;

  return (
    <div className="space-y-8">
      <div className="fixed right-6 top-24 z-50 space-y-3">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`glass-card max-w-sm rounded-xl px-4 py-3 text-sm font-medium ${
              toast.type === "success" ? "text-white" : "text-[#a3a3a3]"
            }`}
          >
            {toast.type === "success" ? "✓ " : "✕ "}
            {toast.message}
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#525252]">Manage</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-white">Inventory</h1>
      </motion.div>

      <motion.form
        onSubmit={handleScanSubmit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-card rounded-2xl p-6 space-y-5"
      >
        <div>
          <h2 className="text-lg font-bold text-white">Barcode Scan</h2>
          <p className="mt-1 text-sm text-[#525252]">
            Scan a barcode to auto-create/update product inventory for your store.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[#525252]">Barcode</label>
            <input
              type="text"
              value={scanBarcode}
              onChange={(event) => setScanBarcode(event.target.value)}
              placeholder="Scan barcode here"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[#525252]">Quantity</label>
            <input
              type="number"
              min={1}
              value={scanQty}
              onChange={(event) => setScanQty(Math.max(1, Number(event.target.value) || 1))}
              className="glass-input w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[#525252]">Price (INR)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={scanPrice}
              onChange={(event) => setScanPrice(event.target.value)}
              placeholder="Optional"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[#525252]">Product Name</label>
            <input
              type="text"
              value={scanName}
              onChange={(event) => setScanName(event.target.value)}
              placeholder="Optional for new product"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[#525252]">Category</label>
            <input
              type="text"
              value={scanCategory}
              onChange={(event) => setScanCategory(event.target.value)}
              placeholder="Optional"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[#525252]">Description</label>
          <textarea
            rows={2}
            value={scanDescription}
            onChange={(event) => setScanDescription(event.target.value)}
            placeholder="Optional"
            className="glass-input w-full rounded-xl px-4 py-3 text-sm resize-none"
          />
        </div>

        <button type="submit" disabled={submittingScan} className="btn-gradient rounded-xl px-5 py-3 text-sm">
          {submittingScan ? "Processing scan..." : "Process Scan"}
        </button>
      </motion.form>

      {error && (
        <div className="glass-card rounded-2xl p-4">
          <p className="text-sm text-[#a3a3a3]">{error}</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Products", value: totalProducts, icon: "📦" },
          { label: "Low Stock", value: lowStock, icon: "⚠️" },
          { label: "Out of Stock", value: outOfStock, icon: "🚫" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            className="glass-card rounded-2xl p-5 flex items-center gap-4"
          >
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-[#525252]">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-xs w-full">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..." className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm" />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat} type="button" onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                categoryFilter === cat ? "bg-white text-black" : "glass-card text-[#525252] hover:text-white"
              }`}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Inventory table */}
      <div className="space-y-3">
        {loading && (
          <div className="glass-card rounded-2xl p-6 text-sm text-[#525252]">Loading inventory...</div>
        )}

        {filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="glass-card rounded-2xl p-5 transition-all"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Product info */}
              <div className="flex items-center gap-4 sm:flex-1">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)]">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover grayscale" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a] text-[#1a1a1a]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-6 w-6"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-white">{item.product.name}</h3>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#525252]">{item.product.category}</span>
                  {item.product.barcode && (
                    <p className="mt-1 text-[11px] text-[#525252]">Barcode: {item.product.barcode}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{item.available_qty} <span className="text-[#525252] font-normal">/ {item.total_qty}</span></p>
                  <StockBadge available={item.available_qty} total={item.total_qty} />
                  <p className="mt-1 text-xs text-[#525252]">
                    ₹{((item.product.price_paise ?? 0) / 100).toFixed(2)}
                  </p>
                </div>
                {/* Stock bar */}
                <div className="hidden w-24 sm:block">
                  <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)]">
                    <div
                      className="h-full rounded-full bg-white/30 transition-all"
                      style={{ width: `${item.total_qty > 0 ? (item.available_qty / item.total_qty) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card rounded-2xl p-12 text-center">
            <p className="text-sm text-[#525252]">No products match your filter.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
