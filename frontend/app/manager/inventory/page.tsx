"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { mockInventory } from "@/lib/mock-data";
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
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ total_qty: 0, available_qty: 0 });
  const [saved, setSaved] = useState<string | null>(null);

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

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValues({ total_qty: item.total_qty, available_qty: item.available_qty });
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = (id: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, total_qty: editValues.total_qty, available_qty: Math.min(editValues.available_qty, editValues.total_qty), updated_at: new Date().toISOString() }
          : item
      )
    );
    setEditingId(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  };

  const totalProducts = inventory.length;
  const lowStock = inventory.filter((i) => i.available_qty > 0 && i.available_qty / i.total_qty <= 0.2).length;
  const outOfStock = inventory.filter((i) => i.available_qty === 0).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#525252]">Manage</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-white">Inventory</h1>
      </motion.div>

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
        {filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className={`glass-card rounded-2xl p-5 transition-all ${saved === item.id ? "border-[rgba(255,255,255,0.3)]" : ""}`}
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
                </div>
              </div>

              {/* Stock info or edit */}
              {editingId === item.id ? (
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#525252]">Total</label>
                    <input type="number" value={editValues.total_qty} min={0}
                      onChange={(e) => setEditValues((v) => ({ ...v, total_qty: Number(e.target.value) }))}
                      className="glass-input w-20 rounded-lg px-3 py-2 text-center text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#525252]">Available</label>
                    <input type="number" value={editValues.available_qty} min={0} max={editValues.total_qty}
                      onChange={(e) => setEditValues((v) => ({ ...v, available_qty: Number(e.target.value) }))}
                      className="glass-input w-20 rounded-lg px-3 py-2 text-center text-sm" />
                  </div>
                  <button type="button" onClick={() => saveEdit(item.id)}
                    className="btn-gradient rounded-lg px-4 py-2 text-xs">Save</button>
                  <button type="button" onClick={cancelEdit}
                    className="btn-ghost rounded-lg px-3 py-2 text-xs">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{item.available_qty} <span className="text-[#525252] font-normal">/ {item.total_qty}</span></p>
                    <StockBadge available={item.available_qty} total={item.total_qty} />
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
                  <button type="button" onClick={() => startEdit(item)}
                    className="btn-ghost rounded-lg px-3 py-2 text-xs">Edit</button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card rounded-2xl p-12 text-center">
            <p className="text-sm text-[#525252]">No products match your filter.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
