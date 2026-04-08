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

const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0a1628" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a1628" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#162744" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1e3a5f" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e3a5f" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#030712" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#111d35" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#111d35" }] },
];

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
            styles: darkMapStyles,
            backgroundColor: "#0a1628",
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
          fillColor: store.id === selectedStoreId ? "#3b82f6" : "#60a5fa",
          fillOpacity: 1,
          strokeColor: store.id === selectedStoreId ? "#93bbfd" : "rgba(255,255,255,0.3)",
          strokeWeight: store.id === selectedStoreId ? 3 : 2,
        },
      });

      marker.addListener("click", () => {
        onMarkerClick(store.id);
        const content = document.createElement("div");
        content.style.padding = "8px 4px";
        content.style.minWidth = "180px";
        content.style.fontFamily = "Inter, system-ui, sans-serif";

        const title = document.createElement("div");
        title.textContent = store.name;
        title.style.fontWeight = "700";
        title.style.marginBottom = "4px";
        title.style.color = "#0f172a";

        const distance = document.createElement("div");
        distance.textContent = `${store.distance_km.toFixed(1)} km away`;
        distance.style.fontSize = "13px";
        distance.style.color = "#475569";
        distance.style.marginBottom = "8px";

        const link = document.createElement("a");
        link.href = `/reserve?store_id=${store.id}&product_id=${productId}`;
        link.textContent = "Reserve";
        link.style.display = "inline-block";
        link.style.background = "linear-gradient(135deg, #3b82f6, #818cf8)";
        link.style.color = "white";
        link.style.textDecoration = "none";
        link.style.padding = "8px 16px";
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
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl glass-surface p-6 text-center">
        <div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto h-10 w-10 text-[#64748b] mb-3">
            <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
            <circle cx="12" cy="11" r="2.5" />
          </svg>
          <p className="text-sm font-medium text-[#94a3b8]">{loadError}</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="h-full min-h-[320px] w-full rounded-2xl" />;
}
