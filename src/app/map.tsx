"use client";

// Leaflet controls for selecting, reverse-geocoding, and previewing locations.
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { LocateFixed, Maximize2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CircleMarker, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { canReplaceLocationText, coordinatesFallback } from "@/lib/location-sync";
import "leaflet/dist/leaflet.css";

/** Default map center for Murang'a town when no pin has been selected. */
export const MURANGA_CENTER: [number, number] = [-0.72, 37.15];
const LeafletMap256 = dynamic(() => import("react-leaflet").then((module) => module.MapContainer), {
  ssr: false,
  loading: () => <Skeleton height={256} className="w-full" />,
});
const LeafletMap192 = dynamic(() => import("react-leaflet").then((module) => module.MapContainer), {
  ssr: false,
  loading: () => <Skeleton height={192} className="w-full" />,
});
const reverseCache = new Map<string, string>();
let lastGeocodeAt = 0;
const pinIcon = divIcon({
  className: "tatua-map-pin",
  html: "<span></span>",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function keyFor(value: [number, number]) {
  return `${value[0].toFixed(5)},${value[1].toFixed(5)}`;
}

function readableAddress(
  data: { display_name?: string; address?: Record<string, string> },
  value: [number, number],
) {
  const address = data.address ?? {};
  const parts = [
    address.road,
    address.suburb ?? address.neighbourhood,
    address.town ?? address.city,
    address.county,
  ].filter(Boolean);
  return parts.length
    ? parts.slice(0, 3).join(", ")
    : (data.display_name ?? coordinatesFallback(value));
}

/** Looks up a Kenya-restricted address for a selected coordinate. */
export async function reverseGeocode(value: [number, number]) {
  const key = keyFor(value);
  const cached = reverseCache.get(key);
  if (cached) return cached;
  const wait = Math.max(0, 1000 - (Date.now() - lastGeocodeAt));
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  lastGeocodeAt = Date.now();
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${value[0]}&lon=${value[1]}&addressdetails=1&zoom=18&countrycodes=ke`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error("Reverse geocoding failed");
  const address = readableAddress(await response.json(), value);
  reverseCache.set(key, address);
  return address;
}

async function geocode(query: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ke&q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error("Geocoding failed");
  const result = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name?: string;
    address?: Record<string, string>;
  }>;
  if (!result[0]) return null;
  const value: [number, number] = [Number(result[0].lat), Number(result[0].lon)];
  return { value, address: readableAddress(result[0], value) };
}

function MapInteractions({
  value,
  onChange,
}: {
  value: [number, number] | null;
  onChange: (value: [number, number]) => void;
}) {
  const map = useMap();
  useMapEvents({
    click: async (event) => {
      const next: [number, number] = [event.latlng.lat, event.latlng.lng];
      onChange(next);
    },
  });
  useEffect(() => {
    const container = map.getContainer();
    container.tabIndex = 0;
    container.setAttribute("aria-label", "Interactive location map. Use arrow keys to pan.");
    const enableScrollZoom = () => map.scrollWheelZoom.enable();
    const onKeyDown = (event: KeyboardEvent) => {
      const pan: Record<string, [number, number]> = {
        ArrowUp: [0, -80],
        ArrowDown: [0, 80],
        ArrowLeft: [-80, 0],
        ArrowRight: [80, 0],
      };
      if (pan[event.key]) {
        event.preventDefault();
        map.panBy(pan[event.key]);
      }
      if (event.key === "+" || event.key === "=") map.zoomIn();
      if (event.key === "-") map.zoomOut();
    };
    container.addEventListener("keydown", onKeyDown);
    container.addEventListener("focus", enableScrollZoom);
    container.addEventListener("click", enableScrollZoom);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      container.removeEventListener("focus", enableScrollZoom);
      container.removeEventListener("click", enableScrollZoom);
    };
  }, [map]);
  useEffect(() => {
    if (value) map.setView(value);
  }, [map, value]);
  return value ? (
    <Marker
      position={value}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const position = event.target.getLatLng();
          onChange([position.lat, position.lng]);
        },
      }}
      icon={pinIcon}
    />
  ) : null;
}

function MapCanvas({
  value,
  onChange,
  zoom = 12,
}: {
  value: [number, number] | null;
  onChange: (value: [number, number]) => void;
  zoom?: number;
}) {
  return (
    <LeafletMap256
      center={value ?? MURANGA_CENTER}
      zoom={zoom}
      scrollWheelZoom={false}
      touchZoom="center"
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapInteractions value={value} onChange={onChange} />
    </LeafletMap256>
  );
}

/** Provides an editable map pin synchronized with the location text field. */
export function MapPicker({
  locationText,
  onLocationTextChange,
  value,
  onChange,
}: {
  locationText: string;
  onLocationTextChange: (value: string) => void;
  value: [number, number] | null;
  onChange: (value: [number, number] | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [draftText, setDraftText] = useState(locationText);
  const [autoFilled, setAutoFilled] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const textWasAutoFilled = useRef(false);
  const lastSyncedText = useRef(locationText);
  useEffect(() => {
    if (locationText !== lastSyncedText.current) textWasAutoFilled.current = false;
    lastSyncedText.current = locationText;
  }, [locationText]);

  const applyAddress = (address: string) => {
    if (canReplaceLocationText(locationText, textWasAutoFilled.current)) {
      onLocationTextChange(address);
      lastSyncedText.current = address;
      setAutoFilled(true);
      textWasAutoFilled.current = true;
    } else {
      setPrompt(address);
    }
  };
  const pinChanged = async (next: [number, number]) => {
    onChange(next);
    try {
      applyAddress(await reverseGeocode(next));
    } catch {
      applyAddress(coordinatesFallback(next));
    }
  };
  const findOnMap = async () => {
    if (!locationText.trim()) return;
    try {
      const result = await geocode(locationText.trim());
      if (!result) {
        setMessage("No location found in Kenya. Your text was kept.");
        return;
      }
      onChange(result.value);
      setAutoFilled(false);
      setMessage(`Pinned near ${result.address}.`);
    } catch {
      setMessage("Location search is unavailable right now. Your text was kept.");
    }
  };
  const openExpanded = () => {
    setDraftValue(value);
    setDraftText(locationText);
    setMessage("");
    setExpanded(true);
  };
  const cancelExpanded = () => {
    setDraftValue(value);
    setDraftText(locationText);
    setExpanded(false);
  };
  const confirmExpanded = () => {
    onChange(draftValue);
    onLocationTextChange(draftText);
    setExpanded(false);
  };
  const locate = () =>
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void pinChanged([coords.latitude, coords.longitude]);
      },
      () => setMessage("We could not access your current location."),
    );

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-card-foreground">
            Pin the location <span className="font-normal text-muted-foreground">(optional)</span>
          </p>
          <button
            type="button"
            onClick={openExpanded}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold"
          >
            <Maximize2 size={15} />
            Expand
          </button>
        </div>
        <div className="h-64 overflow-hidden rounded-xl border">
          <Suspense fallback={<Skeleton height={256} className="w-full" />}>
            <MapCanvas value={value} onChange={pinChanged} />
          </Suspense>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={findOnMap}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold"
          >
            <Search size={15} />
            Find on map
          </button>
          <button
            type="button"
            onClick={locate}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold"
          >
            <LocateFixed size={15} />
            Use my location
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold"
            >
              <X size={15} />
              Clear pin
            </button>
          )}
        </div>
        {autoFilled && (
          <p className="text-xs text-muted-foreground">
            Location text was filled from the pin and remains editable.
          </p>
        )}
        {prompt && (
          <p className="rounded-lg border border-warning/40 bg-warning/10 p-2 text-xs text-foreground">
            Use the pinned address instead of your text?{" "}
            <button
              type="button"
              className="font-bold text-primary underline"
              onClick={() => {
                onLocationTextChange(prompt);
                lastSyncedText.current = prompt;
                setPrompt(null);
                setAutoFilled(true);
                textWasAutoFilled.current = true;
              }}
            >
              Use pinned address
            </button>{" "}
            <button type="button" className="ml-2 underline" onClick={() => setPrompt(null)}>
              Keep my text
            </button>
          </p>
        )}
        {message && (
          <p role="status" className="text-xs text-muted-foreground">
            {message}
          </p>
        )}
        <input type="hidden" name="latitude" value={value?.[0] ?? ""} />
        <input type="hidden" name="longitude" value={value?.[1] ?? ""} />
        <p className="text-xs text-muted-foreground">
          Click or focus the map to enable keyboard controls. Scroll-wheel zoom stays off until you
          explicitly zoom with the controls.
        </p>
      </div>
      <Dialog open={expanded} onOpenChange={(open) => (open ? openExpanded() : cancelExpanded())}>
        <DialogContent className="flex h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] max-w-6xl flex-col gap-0 overflow-hidden p-4 sm:h-[min(90dvh,52rem)] sm:w-[calc(100%-2rem)] sm:p-6">
          <DialogHeader className="shrink-0">
            <DialogTitle>Confirm location</DialogTitle>
            <DialogDescription>
              Search or adjust the pin. Cancel restores the location before this dialog opened.
            </DialogDescription>
          </DialogHeader>
          <div className="mb-3 flex shrink-0 gap-2">
            <input
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void (async () => {
                    const result = await geocode(draftText);
                    if (result) {
                      setDraftValue(result.value);
                      setDraftText(result.address);
                    }
                  })();
                }
              }}
              className="min-h-11 min-w-0 flex-1 rounded-lg border bg-background px-3 text-foreground"
              aria-label="Location text"
            />
            <button
              type="button"
              onClick={() => {
                const result = geocode(draftText);
                void result.then((found) => {
                  if (found) {
                    setDraftValue(found.value);
                    setDraftText(found.address);
                  }
                });
              }}
              className="rounded-lg bg-primary px-4 font-bold text-primary-foreground"
            >
              Find
            </button>
          </div>
          <div className="min-h-[16rem] flex-1 overflow-hidden rounded-xl border">
            <Suspense fallback={<Skeleton height={256} className="w-full" />}>
              <MapCanvas
                value={draftValue}
                onChange={(next) => {
                  setDraftValue(next);
                  void reverseGeocode(next)
                    .then(setDraftText)
                    .catch(() => undefined);
                }}
                zoom={13}
              />
            </Suspense>
          </div>
          <div className="mt-3 flex shrink-0 flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={cancelExpanded}
              className="min-h-11 rounded-lg border px-4 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmExpanded}
              className="min-h-11 rounded-lg bg-primary px-4 font-bold text-primary-foreground"
            >
              Confirm location
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Displays a non-interactive map for an already stored request location. */
export function MapPreview({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  if (latitude === null || longitude === null) return null;
  const value: [number, number] = [latitude, longitude];
  return (
    <div className="mt-5 h-48 shrink-0 overflow-hidden rounded-xl border">
      <LeafletMap192 center={value} zoom={15} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={value}
          radius={9}
          pathOptions={{ color: "#087f78", fillColor: "#5ed8ca", fillOpacity: 0.9 }}
        />
      </LeafletMap192>
      <a
        className="sr-only"
        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`}
      >
        Open in maps
      </a>
    </div>
  );
}
