import React, { useEffect, useRef, useState } from "react";
import { Map, MapControls, MapMarker, MarkerContent, MarkerLabel, MarkerPopup } from "@/components/ui/map";
import { Navigation } from "lucide-react";
import { Button } from ".";
import { SearchBar } from "./SearchBar";
import type { Mascota } from "@/types/mascota";
import { assets, normalizeImage } from "@/lib/imageUtils";

const toCoord = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const getThumbnail = (m: Mascota): string =>
  m.thumbnail_url ? normalizeImage(m.thumbnail_url) : "";

const getOriginal = (m: Mascota): string =>
  m.imagen_url ? normalizeImage(m.imagen_url) : "";

const getBorderColor = (estado?: string): string => {
  if (!estado) return "border-gray-400";
  const estadoLower = estado.toLowerCase();
  if (estadoLower.includes("perd")) return "border-red-500";
  if (estadoLower.includes("encont")) return "border-green-500";
  return "border-gray-400";
};

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

  // Manejar búsqueda desde el SearchBar
  const handleSearch = (lat: number, lon: number, query: string) => {
    const map = mapRef.current as any;
    if (map) {
      map.flyTo({ center: [lon, lat], zoom: 14, duration: 1400 });
    }
  };

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
          const lat = toCoord(m.latitud);
          const lng = toCoord(m.longitud);
          if (typeof lat !== "number" || typeof lng !== "number") return false;
          return lat >= sw.lat && lat <= ne.lat && lng >= sw.lng && lng <= ne.lng;
        });

        onVisibleChange?.(visible.slice(0, 10));
      } catch (e) {
        // ignore until map ready
      }
    };

    map.on && map.on("moveend", updateVisible);
    map.on && map.on("load", updateVisible);

    updateVisible();

    return () => {
      map.off && map.off("moveend", updateVisible);
      map.off && map.off("load", updateVisible);
    };
  }, [mascotas, onVisibleChange]);

  return (
    <div>
      <div className="px-4 md:px-6 py-4">
        <SearchBar onSearch={handleSearch} />
      </div>

      <div className="h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[75vh] xl:h-[80vh] w-full">
        <Map ref={mapRef} center={[-75.56843, 6.270]} zoom={11}>
          <MapControls position="bottom-right" showZoom showCompass showLocate showFullscreen />

          {mascotas.map((m) => {
            const lng = toCoord(m.longitud);
            const lat = toCoord(m.latitud);
            if (typeof lng !== "number" || typeof lat !== "number") return null;

            const thumbnailSrc = getThumbnail(m);
            const originalSrc = getOriginal(m);
            const markerSrc = thumbnailSrc || originalSrc || assets.max;
            const borderColor = getBorderColor(m.estado);

            return (
              <MapMarker key={m.id} longitude={lng} latitude={lat}>
                <MarkerContent>
                  <div className={`size-6 rounded-full overflow-hidden border-2 ${borderColor} shadow-lg cursor-pointer hover:scale-110 transition-transform`}>
                    <img
                      key={`marker-${m.id}-${thumbnailSrc}`}
                      src={markerSrc}
                      alt={m.nombre}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        const backup = originalSrc;
                        if (backup && img.src !== backup) {
                          img.src = backup;
                          return;
                        }
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
                    <img
                      key={`popup-${m.id}-${thumbnailSrc}`}
                      src={markerSrc}
                      alt={m.nombre}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        const backup = originalSrc;
                        if (backup && img.src !== backup) {
                          img.src = backup;
                          return;
                        }
                        img.onerror = null;
                        img.src = assets.max;
                      }}
                      className="object-cover w-full h-full"
                    />
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
            );
          })}
        </Map>
      </div>
    </div>
  );
}