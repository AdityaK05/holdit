"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import axios from "axios";

import MapView from "@/components/MapView";
import SearchBar from "@/components/SearchBar";
import StoreCard from "@/components/StoreCard";
import api from "@/lib/api";
import type { ApiResponse, StoreWithDistance } from "@/lib/types";

type LocationState = "prompt" | "requesting" | "ready" | "manual";
type ViewTab = "list" | "map";

function StoreSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-4">
        <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-28 animate-pulse rounded-full bg-slate-200" />
        <div className="h-11 w-full animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

async function geocodeCity(city: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`,
  );
  const data = await response.json();

  const location = data.results?.[0]?.geometry?.location;
  if (!location) {
    throw new Error("Location not found");
  }

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
    if (!productId) {
      setError("Missing product selection");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get<ApiResponse<{ stores: StoreWithDistance[] }>>(
        `/stores/nearby?lat=${lat}&lng=${lng}&product_id=${productId}`,
      );
      setStores(response.data.data.stores);
      setSelectedStoreId(response.data.data.stores[0]?.id);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Something went wrong");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState("manual");
      return;
    }

    setLocationState("requesting");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoordinates(nextCoordinates);
        setLocationState("ready");
        void fetchNearbyStores(nextCoordinates.lat, nextCoordinates.lng);
      },
      () => {
        setLocationState("manual");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const handleManualLocationSearch = async (query: string) => {
    try {
      setError("");
      setLoading(true);
      const nextCoordinates = await geocodeCity(query);
      setManualLocation(query);
      setCoordinates(nextCoordinates);
      setLocationState("ready");
      await fetchNearbyStores(nextCoordinates.lat, nextCoordinates.lng);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            Looking for {productName}
          </span>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Nearby stores with stock
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Pick a store to reserve your item before heading out.
              </p>
            </div>
            {coordinates ? (
              <p className="text-sm text-slate-500">
                Location locked for nearby search
                {manualLocation ? `: ${manualLocation}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        {!hasLocation ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="max-w-2xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Find stores near you</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Share your location so we can show stores within 10 km, or search by city if you prefer.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={locationState === "requesting"}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {locationState === "requesting" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Requesting location
                    </>
                  ) : (
                    "Use my current location"
                  )}
                </button>
              </div>

              {locationState === "manual" ? (
                <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-600">
                    Location permission was denied or unavailable. Search by city instead.
                  </p>
                  <SearchBar
                    defaultValue={manualLocation}
                    loading={loading}
                    onSearch={(value) => void handleManualLocationSearch(value)}
                  />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-700">Something went wrong</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => {
                if (coordinates) {
                  void fetchNearbyStores(coordinates.lat, coordinates.lng);
                }
              }}
              className="mt-4 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="flex rounded-2xl border border-slate-200 bg-white p-1 md:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
              activeTab === "list" ? "bg-blue-600 text-white" : "text-slate-600"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
              activeTab === "map" ? "bg-blue-600 text-white" : "text-slate-600"
            }`}
          >
            Map
          </button>
        </div>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className={`${activeTab === "map" ? "hidden md:block" : ""} lg:col-span-3`}>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <StoreSkeleton key={index} />)
              ) : stores.length ? (
                stores.map((store) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    productId={productId}
                    selected={selectedStoreId === store.id}
                    onSelect={() => setSelectedStoreId(store.id)}
                  />
                ))
              ) : hasLocation ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900">No stores found nearby</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Try another area or search for a different product.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className={`${activeTab === "list" ? "hidden md:block" : ""} lg:col-span-2`}>
            <div className="sticky top-24 overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <MapView
                stores={stores}
                productId={productId}
                selectedStoreId={selectedStoreId}
                onMarkerClick={(id) => {
                  setSelectedStoreId(id);
                  setActiveTab("list");
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function StoresPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <section className="grid gap-6 lg:grid-cols-5">
              <div className="space-y-4 lg:col-span-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <StoreSkeleton key={index} />
                ))}
              </div>
              <div className="hidden lg:block lg:col-span-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                  Loading map...
                </div>
              </div>
            </section>
          </div>
        </main>
      }
    >
      <StoresPageContent />
    </Suspense>
  );
}
