import React, { useEffect, useRef, useState } from "react";
import { Map, MapControls, MapMarker, MarkerContent, MarkerLabel, MarkerPopup } from "@/components/ui/map";
import { Navigation } from "lucide-react";
import { Button } from ".";
import type { Mascota } from "@/types/mascota";
import { assets, normalizeImage } from "@/lib/imageUtils";

export default function MapWithSearch({
  mascotas = [],
  onVisibleChange,
  onSelectMascota,
}: {
  mascotas?: Mascota[];
  onVisibleChange?: (visible: Mascota[]) => void;
  onSelectMascota?: (m: Mascota) => void;
}) {
  const mapRef = useRef<any>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

  // geocode when query changes
  useEffect(() => {
    if (!searchQuery) return;
    const map = mapRef.current as any;
    if (!map || typeof fetch === "undefined") return;

    const controller = new AbortController();
    const q = searchQuery;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;

    fetch(url, { signal: controller.signal, headers: { "Accept-Language": "es" } })
      .then((res) => res.json())
      .then((results) => {
        if (!results || results.length === 0) return;
        const r = results[0];
        const lat = parseFloat(r.lat);
        const lon = parseFloat(r.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          try {
            map.flyTo({ center: [lon, lat], zoom: 14, duration: 1400 });
          } catch (e) {
            // ignore
          }
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [searchQuery]);

  // compute visible mascotas based on map bounds
  useEffect(() => {
    const map = mapRef.current as any;
    if (!map) return;

    const updateVisible = () => {
      try {
        const bounds = map.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const visible = mascotas.filter((m) => {
          if (typeof m.latitud !== "number" || typeof m.longitud !== "number") return false;
          const lat = m.latitud as number;
          const lng = m.longitud as number;
          return lat >= sw.lat && lat <= ne.lat && lng >= sw.lng && lng <= ne.lng;
        });

        onVisibleChange?.(visible.slice(0, 10));
      } catch (e) {
        // ignore until map ready
      }
    };

    map.on && map.on("moveend", updateVisible);
    map.on && map.on("load", updateVisible);

    // initial
    updateVisible();

    return () => {
      map.off && map.off("moveend", updateVisible);
      map.off && map.off("load", updateVisible);
    };
  }, [mascotas, onVisibleChange]);

  return (
    <div>
      <div className="px-4 md:px-6 py-4">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-4 rounded-2xl border border-[#e5e7eb] bg-white/90 px-4 py-2 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="7" r="5.5" stroke="#8c7851" strokeWidth="1.5" />
              <path d="M11.2 11.2L16 16" stroke="#8c7851" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchQuery(searchInput.trim() || undefined);
                }
              }}
              className="w-full bg-transparent text-sm font-medium text-[#716040] placeholder:text-[#b7a888] focus:outline-none"
              placeholder="Buscar zona, calle o ciudad... (Enter para buscar)"
              type="search"
            />
          </div>
        </div>
      </div>

      <div className="h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[75vh] xl:h-[80vh] w-full">
        <Map ref={mapRef} center={[-75.56843, 6.270]} zoom={11}>
          <MapControls position="bottom-right" showZoom showCompass showLocate showFullscreen />

          {mascotas
            .filter((m) => typeof m.longitud === "number" && typeof m.latitud === "number")
            .map((m) => (
              <MapMarker key={m.id} longitude={m.longitud as number} latitude={m.latitud as number}>
                <MarkerContent>
                  <div className="size-6 rounded-full overflow-hidden border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                    <img
                      src={normalizeImage(m.url_imagen)}
                      alt={m.nombre}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.onerror = null;
                        img.src = assets.max;
                      }}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <MarkerLabel position="bottom">{m.nombre}</MarkerLabel>
                </MarkerContent>
                <MarkerPopup className="p-0 w-56">
                  <div className="relative h-24 overflow-hidden rounded-t-md w-full">
                    <img src={normalizeImage(m.url_imagen)} alt={m.nombre} className="object-cover w-full h-full" />
                  </div>

                  <div className="p-3 flex flex-col space-y-2 max-h-36">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{m.tipo}</span>
                      <h3 className="font-semibold text-foreground leading-tight truncate">{m.nombre}</h3>
                    </div>

                    <div className="text-sm text-muted-foreground overflow-auto max-h-20">{m.descripcion}</div>

                    <div className="flex gap-2 pt-1 mt-auto">
                      <Button size="sm" className="flex-1 h-8" onClick={() => onSelectMascota?.(m)}>
                        <Navigation className="size-3.5 mr-1.5" />
                        Ver
                      </Button>
                    </div>
                  </div>
                </MarkerPopup>
              </MapMarker>
            ))}
        </Map>
      </div>
    </div>
  );
}
