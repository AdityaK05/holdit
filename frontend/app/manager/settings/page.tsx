"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { getUser, logout } from "@/lib/auth";

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

export default function ManagerSettingsPage() {
  const user = getUser();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    newReservation: true,
    reservationConfirmed: true,
    lowStock: true,
    dailySummary: false,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#525252]">Account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-white">Settings</h1>
        </div>
        <button type="button" disabled={saving} onClick={handleSave}
          className="btn-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
          {saving ? <><span className="spinner-orbital-sm" /> Saving...</> : saved ? "✓ Saved" : "Save Changes"}
        </button>
      </motion.div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Section title="Your Profile" description="Manage your personal account details.">
          <div className="flex items-center gap-5 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.2)] bg-white text-2xl font-bold text-black">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-bold text-white">{name}</p>
              <p className="text-sm text-[#525252]">Store Staff · {email}</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="glass-input w-full rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#525252]">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>
        </Section>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Section title="Notifications" description="Choose what you get notified about.">
          <div className="space-y-1">
            {[
              { key: "newReservation" as const, label: "New Reservation", desc: "When a customer reserves a product" },
              { key: "reservationConfirmed" as const, label: "Reservation Confirmed", desc: "When you or staff confirms a reservation" },
              { key: "lowStock" as const, label: "Low Stock Alert", desc: "When a product drops below 20% availability" },
              { key: "dailySummary" as const, label: "Daily Summary", desc: "End-of-day email with stats and insights" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-xl px-4 py-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-[#525252]">{item.desc}</p>
                </div>
                <button type="button" onClick={() => setNotifications((n) => ({ ...n, [item.key]: !n[item.key] }))}
                  className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${notifications[item.key] ? "bg-white" : "bg-[rgba(255,255,255,0.1)]"}`}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-full transition-all duration-300 ${
                    notifications[item.key] ? "left-6 bg-black" : "left-1 bg-[#525252]"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="glass-card rounded-2xl border-[rgba(255,255,255,0.12)] p-6">
          <h2 className="text-lg font-bold text-white">Danger Zone</h2>
          <p className="mt-1 text-sm text-[#525252]">Irreversible actions.</p>
          <div className="mt-5 flex gap-4">
            <button type="button" onClick={logout}
              className="btn-danger-ghost rounded-xl px-5 py-2.5 text-sm font-semibold">
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
