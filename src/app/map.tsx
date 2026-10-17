"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CircleMarker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export const MURANGA_CENTER: [number, number] = [-0.72, 37.15];
const LeafletMap = dynamic(() => import("react-leaflet").then((module) => module.MapContainer), { ssr: false });

function Picker({ value, onChange }: { value: [number, number] | null; onChange: (value: [number, number]) => void }) {
  useMapEvents({ click(event) { onChange([event.latlng.lat, event.latlng.lng]); } });
  return value ? <CircleMarker center={value} radius={9} pathOptions={{ color: "#087f78", fillColor: "#5ed8ca", fillOpacity: 0.9 }} /> : null;
}

export function MapPicker() {
  const [value, setValue] = useState<[number, number] | null>(null);
  return <div className="space-y-2"><p className="text-sm font-semibold text-card-foreground">Pin the location <span className="font-normal text-muted-foreground">(optional)</span></p><div className="h-64 overflow-hidden rounded-xl border"><LeafletMap center={MURANGA_CENTER} zoom={12} scrollWheelZoom={false} className="h-full w-full"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Picker value={value} onChange={setValue} /></LeafletMap></div><input type="hidden" name="latitude" value={value?.[0] ?? ""} /><input type="hidden" name="longitude" value={value?.[1] ?? ""} /><p className="text-xs text-muted-foreground">Click the map to add a pin. You can still type a location above.</p></div>;
}

export function MapPreview({ latitude, longitude }: { latitude: number | null; longitude: number | null }) {
  if (latitude === null || longitude === null) return null;
  const value: [number, number] = [latitude, longitude];
  return <div className="mt-5 h-48 overflow-hidden rounded-xl border"><LeafletMap center={value} zoom={15} scrollWheelZoom={false} className="h-full w-full"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><CircleMarker center={value} radius={9} pathOptions={{ color: "#087f78", fillColor: "#5ed8ca", fillOpacity: 0.9 }} /></LeafletMap><a className="sr-only" href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`}>Open in maps</a></div>;
}
