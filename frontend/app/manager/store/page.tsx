"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { mockStoreProfile } from "@/lib/mock-data";

const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const dayLabels: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
  friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-[#525252]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function ManagerStorePage() {
  const [store, setStore] = useState(mockStoreProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateField = (field: string, value: string | boolean) => {
    setStore((prev) => ({ ...prev, [field]: value }));
  };

  const updateHours = (day: string, field: "open" | "close" | "closed", value: string | boolean) => {
    setStore((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: { ...prev.hours[day], [field]: value },
      },
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#525252]">Manage</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-white">Store Profile</h1>
        </div>
        <button type="button" disabled={saving} onClick={handleSave}
          className="btn-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
          {saving ? <><span className="spinner-orbital-sm" /> Saving...</> : saved ? "✓ Saved" : "Save Changes"}
        </button>
      </motion.div>

      {/* Store Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Section title="Basic Information" description="Edit your store details visible to customers.">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Store Name</label>
              <input type="text" value={store.name} onChange={(e) => updateField("name", e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Phone</label>
              <input type="tel" value={store.phone} onChange={(e) => updateField("phone", e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Address</label>
              <input type="text" value={store.address} onChange={(e) => updateField("address", e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Description</label>
              <textarea value={store.description} onChange={(e) => updateField("description", e.target.value)}
                rows={3} className="glass-input w-full rounded-xl px-4 py-3 text-sm resize-none" />
            </div>
          </div>
        </Section>
      </motion.div>

      {/* Location */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Section title="Location" description="Coordinates used for nearby store discovery.">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Latitude</label>
              <input type="text" value={store.lat} onChange={(e) => updateField("lat", e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-3 text-sm font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Longitude</label>
              <input type="text" value={store.lng} onChange={(e) => updateField("lng", e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-3 text-sm font-mono" />
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-8 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto h-8 w-8 text-[#525252]">
              <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" /><circle cx="12" cy="11" r="2.5" />
            </svg>
            <p className="mt-2 text-sm text-[#525252]">Map preview available with Google Maps API key</p>
          </div>
        </Section>
      </motion.div>

      {/* Operating Hours */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Section title="Operating Hours" description="Set your weekly schedule.">
          <div className="space-y-3">
            {dayOrder.map((day) => {
              const h = store.hours[day];
              return (
                <div key={day} className="flex items-center gap-4 rounded-xl border border-[rgba(255,255,255,0.04)] px-4 py-3">
                  <span className="w-24 text-sm font-medium text-white">{dayLabels[day]}</span>
                  <label className="flex items-center gap-2 text-xs text-[#525252]">
                    <input type="checkbox" checked={!h.closed}
                      onChange={(e) => updateHours(day, "closed", !e.target.checked)}
                      className="h-4 w-4 rounded border-[rgba(255,255,255,0.2)] bg-transparent accent-white" />
                    Open
                  </label>
                  {!h.closed && (
                    <div className="flex items-center gap-2">
                      <input type="time" value={h.open} onChange={(e) => updateHours(day, "open", e.target.value)}
                        className="glass-input rounded-lg px-2 py-1.5 text-xs" />
                      <span className="text-xs text-[#525252]">to</span>
                      <input type="time" value={h.close} onChange={(e) => updateHours(day, "close", e.target.value)}
                        className="glass-input rounded-lg px-2 py-1.5 text-xs" />
                    </div>
                  )}
                  {h.closed && <span className="text-xs text-[#3a3a3a]">Closed</span>}
                </div>
              );
            })}
          </div>
        </Section>
      </motion.div>

      {/* Store Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Section title="Store Status">
          <div className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.06)] px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-white">Store Visibility</p>
              <p className="mt-1 text-xs text-[#525252]">When inactive, your store won&apos;t appear in customer search results.</p>
            </div>
            <button type="button" onClick={() => updateField("is_active", !store.is_active)}
              className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${store.is_active ? "bg-white" : "bg-[rgba(255,255,255,0.1)]"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full transition-all duration-300 ${
                store.is_active ? "left-6 bg-black" : "left-1 bg-[#525252]"
              }`} />
            </button>
          </div>
        </Section>
      </motion.div>
    </div>
  );
}
