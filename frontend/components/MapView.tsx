"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import Link from "next/link";
import type { StoreWithDistance } from "@/lib/types";

interface MapViewProps {
  stores: StoreWithDistance[];
  productId: string;
  selectedStoreId?: string;
  onMarkerClick: (id: string) => void;
}

const defaultCenter: [number, number] = [20.5937, 78.9629];

// Component to dynamically fit the bounds of all markers when they change
function FitBounds({ stores }: { stores: StoreWithDistance[] }) {
  const map = useMap();
  useEffect(() => {
    if (stores.length === 0) {
      map.setView(defaultCenter, 5);
      return;
    }
    
    // Convert store lat/lng strings to numbers and create Leaflet LatLng objects
    const latLngs = stores.map((store) => 
      L.latLng(Number(store.lat), Number(store.lng))
    );
    
    // Create a bounds object and fit the map to it
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, stores]);

  return null;
}

// Function to create a custom div icon
const createCustomIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="
      background-color: ${isSelected ? '#3b82f6' : '#60a5fa'};
      width: ${isSelected ? '20px' : '14px'};
      height: ${isSelected ? '20px' : '14px'};
      border-radius: 50%;
      border: ${isSelected ? '3px solid #93bbfd' : '2px solid rgba(255,255,255,0.8)'};
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10], // Center the marker on the point
  });
};

export default function MapView({
  stores,
  productId,
  selectedStoreId,
  onMarkerClick,
}: MapViewProps) {
  // Fix for React Hydration and Next.js SSR with Leaflet
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full min-h-[320px] w-full items-center justify-center rounded-2xl glass-surface p-6 text-center">
        <div className="spinner-orbital" />
      </div>
    );
  }

  return (
    <div className="h-full min-h-[320px] w-full rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        style={{ height: "100%", width: "100%", background: "#0a1628" }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* Dark-themed OpenStreetMap tiles via CartoDB Dark Matter to match the Noir aesthetic */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={20}
        />
        
        <FitBounds stores={stores} />

        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[Number(store.lat), Number(store.lng)]}
            icon={createCustomIcon(store.id === selectedStoreId)}
            eventHandlers={{
              click: () => onMarkerClick(store.id),
            }}
          >
            <Popup 
               className="dark-popup"
               closeButton={false} 
               offset={[0, -5]}
            >
              <div className="font-sans text-left min-w-[160px] p-1">
                <div className="font-bold text-[#0f172a] text-sm mb-1">{store.name}</div>
                <div className="text-[13px] text-[#475569] mb-3">{store.distance_km.toFixed(1)} km away</div>
                <Link
                  href={`/reserve?store_id=${store.id}&product_id=${productId}`}
                  className="block w-full text-center bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-semibold text-[13px] px-4 py-2 rounded-lg decoration-none !text-white hover:opacity-90 transition-opacity"
                >
                  Reserve
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Custom styles for Leaflet elements that cannot be styles with Tailwind */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container {
           font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 10px;
        }
        .leaflet-popup-tip {
          box-shadow: none;
        }
        .custom-leaflet-marker {
          background: transparent;
          border: none;
        }
      `}} />
    </div>
  );
}
