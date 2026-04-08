"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import MapView from "@/components/MapView";
import SearchBar from "@/components/SearchBar";
import StoreCard from "@/components/StoreCard";
import api from "@/lib/api";
import { mockStores } from "@/lib/mock-data";
import type { ApiResponse, StoreWithDistance } from "@/lib/types";

type LocationState = "prompt" | "requesting" | "ready" | "manual";
type ViewTab = "list" | "map";

function StoreSkeleton() {
  return <div className="glass-card rounded-2xl p-6"><div className="space-y-4"><div className="h-6 w-1/2 rounded skeleton-shimmer" /><div className="h-4 w-full rounded skeleton-shimmer" /><div className="h-4 w-4/5 rounded skeleton-shimmer" /><div className="h-11 w-full rounded-xl skeleton-shimmer" /></div></div>;
}

async function geocodeCity(city: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`);
  const data = await res.json();
  const location = data.results?.[0]?.geometry?.location;
  if (!location) throw new Error("Not found");
  return { lat: location.lat as number, lng: location.lng as number };
}

function StoresPageContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product_id") ?? "";
  const productName = searchParams.get("name") ?? "Selected product";
  const [stores, setStores] = useState<StoreWithDistance[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(undefined);
  const [locationState, setLocationState] = useState<LocationState>("prompt");
  const [manualLocation, setManualLocation] = useState("");
  const [activeTab, setActiveTab] = useState<ViewTab>("list");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasLocation = useMemo(() => coordinates !== null, [coordinates]);

  const fetchNearbyStores = async (lat: number, lng: number) => {
    if (!productId) { setError("Missing product"); return; }
    setLoading(true); setError("");
    try {
      const res = await api.get<ApiResponse<{ stores: StoreWithDistance[] }>>(`/stores/nearby?lat=${lat}&lng=${lng}&product_id=${productId}`);
      setStores(res.data.data.stores);
      setSelectedStoreId(res.data.data.stores[0]?.id);
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        // Backend down — use mock data
        setStores(mockStores);
        setSelectedStoreId(mockStores[0]?.id);
        setLoading(false);
        return;
      }
      if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? "Something went wrong");
      else setError("Something went wrong");
    } finally { setLoading(false); }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationState("manual"); return; }
    setLocationState("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => { const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setCoordinates(c); setLocationState("ready"); void fetchNearbyStores(c.lat, c.lng); },
      () => setLocationState("manual"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => { requestLocation(); }, []);

  const handleManualLocationSearch = async (query: string) => {
    try {
      setError(""); setLoading(true);
      const c = await geocodeCity(query);
      setManualLocation(query); setCoordinates(c); setLocationState("ready");
      await fetchNearbyStores(c.lat, c.lng);
    } catch { setError("Location not found"); setLoading(false); }
  };

  return (
    <main className="min-h-[calc(100vh-73px)] px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#525252]">Looking for {productName}</p>
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">Nearby stores</h1>
        </motion.div>

        {!hasLocation && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-8 max-w-2xl space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">Share your location</h2>
              <p className="mt-2 text-sm text-[#525252]">We&apos;ll show stores within 10 km.</p>
            </div>
            <button type="button" onClick={requestLocation} disabled={locationState === "requesting"}
              className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm">
              {locationState === "requesting" ? <><span className="spinner-orbital-sm" /> Locating...</> : "Use my location"}
            </button>
            {locationState === "manual" && (
              <div className="glass-surface rounded-xl p-4 space-y-3">
                <p className="text-sm text-[#525252]">Or search by city.</p>
                <SearchBar defaultValue={manualLocation} loading={loading} onSearch={(v) => void handleManualLocationSearch(v)} />
              </div>
            )}
          </motion.section>
        )}

        {error && (
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm text-[#a3a3a3]">{error}</p>
            <button type="button" onClick={() => { if (coordinates) void fetchNearbyStores(coordinates.lat, coordinates.lng); }}
              className="btn-gradient mt-4 rounded-xl px-4 py-2 text-sm">Retry</button>
          </div>
        )}

        {/* Tab switcher - mobile */}
        <div className="flex glass-card rounded-xl p-1 md:hidden">
          {(["list", "map"] as ViewTab[]).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold capitalize transition-all ${activeTab === tab ? "btn-gradient shadow-none" : "text-[#525252]"}`}>{tab}</button>
          ))}
        </div>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className={`${activeTab === "map" ? "hidden md:block" : ""} lg:col-span-3 space-y-4`}>
            {loading ? Array.from({ length: 3 }).map((_, i) => <StoreSkeleton key={i} />) : stores.length ? (
              stores.map((store, i) => <StoreCard key={store.id} store={store} productId={productId} selected={selectedStoreId === store.id} onSelect={() => setSelectedStoreId(store.id)} index={i} />)
            ) : hasLocation ? (
              <div className="glass-card rounded-2xl p-16 text-center"><h2 className="text-xl font-bold text-white">No stores nearby</h2><p className="mt-2 text-sm text-[#525252]">Try a different area.</p></div>
            ) : null}
          </div>
          <div className={`${activeTab === "list" ? "hidden md:block" : ""} lg:col-span-2`}>
            <div className="sticky top-24 glass-card overflow-hidden rounded-2xl p-2">
              <MapView stores={stores} productId={productId} selectedStoreId={selectedStoreId}
                onMarkerClick={(id) => { setSelectedStoreId(id); setActiveTab("list"); }} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function StoresPage() {
  return (
    <Suspense fallback={<main className="min-h-[calc(100vh-73px)] px-6 py-16 lg:px-8"><div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-5"><div className="space-y-4 lg:col-span-3">{Array.from({ length: 3 }).map((_, i) => <StoreSkeleton key={i} />)}</div></div></main>}>
      <StoresPageContent />
    </Suspense>
  );
}
