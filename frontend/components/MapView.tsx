"use client";

import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";

import type { StoreWithDistance } from "@/lib/types";

interface MapViewProps {
  stores: StoreWithDistance[];
  productId: string;
  selectedStoreId?: string;
  onMarkerClick: (id: string) => void;
}

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

export default function MapView({
  stores,
  productId,
  selectedStoreId,
  onMarkerClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapRef.current) {
      setLoadError("Google Maps is unavailable right now.");
      return;
    }

    let mounted = true;
    const loader = new Loader({
      apiKey,
      version: "weekly",
    });

    loader
      .load()
      .then(() => {
        if (!mounted || !mapRef.current) {
          return;
        }

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 11,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          infoWindowRef.current = new google.maps.InfoWindow();
        }
      })
      .catch(() => {
        if (mounted) {
          setLoadError("Something went wrong while loading the map.");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (!stores.length) {
      mapInstanceRef.current.setCenter(defaultCenter);
      mapInstanceRef.current.setZoom(11);
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    stores.forEach((store) => {
      const marker = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: {
          lat: Number(store.lat),
          lng: Number(store.lng),
        },
        title: store.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: store.id === selectedStoreId ? 10 : 7,
          fillColor: store.id === selectedStoreId ? "#DC2626" : "#2563EB",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        onMarkerClick(store.id);
        const content = document.createElement("div");
        content.style.padding = "6px 4px";
        content.style.minWidth = "180px";

        const title = document.createElement("div");
        title.textContent = store.name;
        title.style.fontWeight = "700";
        title.style.marginBottom = "4px";

        const distance = document.createElement("div");
        distance.textContent = `${store.distance_km.toFixed(1)} km away`;
        distance.style.fontSize = "13px";
        distance.style.color = "#475569";
        distance.style.marginBottom = "8px";

        const link = document.createElement("a");
        link.href = `/reserve?store_id=${store.id}&product_id=${productId}`;
        link.textContent = "Reserve";
        link.style.display = "inline-block";
        link.style.background = "#2563EB";
        link.style.color = "white";
        link.style.textDecoration = "none";
        link.style.padding = "8px 12px";
        link.style.borderRadius = "10px";
        link.style.fontSize = "13px";
        link.style.fontWeight = "600";

        content.appendChild(title);
        content.appendChild(distance);
        content.appendChild(link);

        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open({
          anchor: marker,
          map: mapInstanceRef.current,
        });
      });

      markersRef.current.push(marker);
      bounds.extend(marker.getPosition() as google.maps.LatLng);
    });

    mapInstanceRef.current.fitBounds(bounds);
  }, [onMarkerClick, productId, selectedStoreId, stores]);

  if (loadError) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
        {loadError}
      </div>
    );
  }

  return <div ref={mapRef} className="h-full min-h-[320px] w-full rounded-3xl" />;
}
