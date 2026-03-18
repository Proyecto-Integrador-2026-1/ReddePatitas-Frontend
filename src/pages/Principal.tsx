import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Map, MapControls, MapMarker, MarkerContent, MarkerLabel, MarkerPopup,} from "@/components/ui/map";
import { Star, Navigation, Clock, ExternalLink } from "lucide-react";
import { Avatar, Chip, PetCard, Pet, SideNav, Button, Badge, Card } from "../components/ui";
import Modal from "../components/ui/Modal";
import type { Mascota } from "../types/mascota";
import { fetchMascotas } from "../services/mascotaService";

const assets = {
  max: "/assets/mascotas/perro1.png",
};

function normalizeImage(url?: string) {
  if (!url) return assets.max;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("public/")) return `/${url.replace(/^public\//, "")}`;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

const navItems = [
  {
    label: "Principal",
    active: true,
    icon: (
      <svg className="h-5 w-5 text-[#8c7851]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13h6v8H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 3h6v18h-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  // {
  //   label: "Publicar Mascota",
  //   icon: (
  //     <svg className="h-5 w-5 text-[#8c7851]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //       <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  //     </svg>
  //   ),
  // },
  // {
  //   label: "Mis Reportes",
  //   icon: (
  //     <svg className="h-5 w-5 text-[#716040] overflow-visible" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //       <path d="M3 7h18M7 12h10M10 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  //     </svg>
  //   ),
  // },
  // {
  //   label: "Notificaciones",
  //   icon: (
  //     <svg className="h-5 w-5 text-[#716040] overflow-visible" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //       <path d="M15 17H9a3 3 0 0 1-3-3V10a6 6 0 1 1 12 0v4a3 3 0 0 1-3 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  //       <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  //     </svg>
  //   ),
  // },
  // {
  //   label: "Mi Perfil",
  //   icon: (
  //     <svg className="h-5 w-5 text-[#716040]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  //       <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  //     </svg>
  //   ),
  // },
  // {
  //   label: "Configuración",
  //   icon: (
  //     <svg className="h-5 w-5 text-[#716040]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //       <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  //       <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.3 18.9l.06-.06c.5-.5.57-1.28.26-1.92A1.65 1.65 0 0 0 2.77 14a1.65 1.65 0 0 0-.33-1.82L2.38 11.9A2 2 0 1 1 5.2 9.07l.06.06c.5.5 1.28.57 1.92.26.64-.31 1.09-.95 1.09-1.67V6a2 2 0 1 1 4 0v.09c0 .72.45 1.36 1.09 1.67.64.31 1.42.24 1.92-.26l.06-.06A2 2 0 1 1 21.7 9.1l-.06.06c-.31.64-.24 1.42.26 1.92.6.6.84 1.5.59 2.34z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  //     </svg>
  //   ),
  // },
];

export function MyMap({
  mascotas = [],
  onVisibleChange,
}: {
  mascotas?: Mascota[];
  onVisibleChange?: (visible: Mascota[]) => void;
}) {
  const mapRef = useRef<any>(null);

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
    <div className="h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[75vh] xl:h-[80vh] w-full">
      <Map ref={mapRef} center={[-75.56843, 6.270]} zoom={11}>
        <MapControls position="bottom-right" showZoom showCompass showLocate showFullscreen />

        {mascotas
          .filter((m) => typeof m.longitud === "number" && typeof m.latitud === "number")
          .map((m) => (
            <MapMarker key={m.id} longitude={m.longitud as number} latitude={m.latitud as number}>
              <MarkerContent>
                <div className="size-6 rounded-full overflow-hidden border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <img src={normalizeImage(m.url_imagen)} alt={m.nombre} className="object-cover w-full h-full" />
                </div>
                <MarkerLabel position="bottom">{m.nombre}</MarkerLabel>
              </MarkerContent>
              <MarkerPopup className="p-0 w-72">
                <div className="relative h-32 overflow-hidden rounded-t-md w-full">
                  <img src={normalizeImage(m.url_imagen)} alt={m.nombre} className="object-cover w-full h-full" />
                </div>
                <div className="space-y-2 p-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {m.tipo}
                    </span>
                    <h3 className="font-semibold text-foreground leading-tight">{m.nombre}</h3>
                  </div>
                  <div className="text-sm text-muted-foreground">{m.descripcion}</div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1 h-8">
                      <Navigation className="size-3.5 mr-1.5" />
                      Contactar
                    </Button>
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
      </Map>
    </div>
  );
}

export function Principal() {
  const navigate = useNavigate();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [visibleMascotas, setVisibleMascotas] = useState<Mascota[]>([]);
  const [selectedMascota, setSelectedMascota] = useState<Mascota | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchMascotas()
      .then((data) => {
        if (!mounted) return;
        setMascotas(data || []);
      })
      .catch((err) => console.error("Error fetching mascotas:", err));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f1ea] text-[#020826]">
      {/*
        Layout wrapper: columna en móviles y fila en pantallas grandes (lg).
        - flex-col en móviles para apilar aside / mapa / panel derecho.
        - lg:flex-row para layout de dos columnas en desktop.
      */}
      <div className="mx-auto flex flex-col lg:flex-row w-full max-w-full gap-6 px-4 md:px-6 py-6">
        {/*
          Aside (navegación): oculto en pantallas pequeñas para ahorrar espacio.
          Se muestra en `lg` (desktop) con ancho fijo.
        */}
        <aside className="hidden lg:flex lg:flex-col lg:min-h-screen w-64 rounded-3xl border border-[#e5e7eb] bg-white/90 p-6 shadow-[0px_25px_50px_rgba(0,0,0,0.1)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#020826] text-white" aria-hidden="false" aria-label="Logo Red de Patitas">
              <img src="/assets/huellas.svg" alt="Red de Patitas" className="h-6 w-6" />
            </div>
            <p className="text-xl font-bold">Red de Patitas</p>
          </div>
          <SideNav items={navItems} />
        </aside>

        {/*
          Contenido principal para escritorio: se divide en dos columnas dentro del área central
          - Columna izquierda (lista):.
          - Columna derecha (mapa):contiene marcadores y panel derecho.
        */}
        <div className="flex-1 flex flex-col rounded-3xl border border-[#e5e7eb] bg-[#f9f4ef]">
          {/* Top bar: buscador centrado y botón Reportar a la derecha */}
          <div className="px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex-1 max-w-[900px] mx-auto">
              <div className="flex items-center gap-4 rounded-2xl border border-[#e5e7eb] bg-white/90 px-4 py-2 shadow-sm">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="7" cy="7" r="5.5" stroke="#8c7851" strokeWidth="1.5" />
                  <path d="M11.2 11.2L16 16" stroke="#8c7851" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  className="w-full bg-transparent text-sm font-medium text-[#716040] placeholder:text-[#b7a888] focus:outline-none"
                  placeholder="Buscar zona, calle o ciudad..."
                  type="search"
                />
              </div>
            </div>
            <div className="ml-4 hidden lg:block">
              <Link to="/reportar">
                <Button variant="solid" size="md">+ Reportar Mascota</Button>
              </Link>
            </div>
          </div>

          {/* Área de contenido: lista a la izquierda y mapa a la derecha */}
          <div className="flex-1 flex gap-6 px-4 md:px-6 pb-6">
            {/* Lista de reportes (desktop) */}
            <div className="hidden lg:flex w-auto max-w-[360px] flex-col">
              <div className="mb-4 flex items-center justify-between px-2">
                <h3 className="text-lg font-bold">Mascotas en la zona</h3>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-220px)] pr-2">
                {visibleMascotas.length > 0 ? (
                  visibleMascotas.slice(0, 20).map((pet) => {
                    const status = (pet.estado || "").toLowerCase().includes("perd") ? ("PERDIDO" as const) : ("ENCONTRADO" as const);
                    return (
                      <PetCard
                        key={pet.id}
                        pet={{
                          name: pet.nombre,
                          status,
                          description: pet.descripcion || "",
                          time: pet.fecha_publicacion || "",
                          location: pet.lugar_desaparicion || "",
                          image: normalizeImage(pet.url_imagen),
                        }}
                        onClick={() => setSelectedMascota(pet)}
                      />
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">No hay mascotas en esta zona</div>
                )}
              </div>
            </div>

            {/* Mapa*/}
            <div className="relative flex-1 overflow-visible rounded-2xl">
              <MyMap mascotas={mascotas} onVisibleChange={setVisibleMascotas} />
            </div>
          </div>
        </div>
      </div>
      <PrincipalModal mascota={selectedMascota} onClose={() => setSelectedMascota(null)} />
    </div>
  );
}

// render modal for selected mascota
// (placed after Principal to keep component focused)
export function PrincipalModal({
  mascota,
  onClose,
}: {
  mascota: Mascota | null;
  onClose: () => void;
}) {
  if (!mascota) return null;

  return (
    <Modal open={!!mascota} onClose={onClose}>
      <div className="space-y-4">
        <div className="w-full flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden">
          <img
            src={normalizeImage(mascota.url_imagen)}
            alt={mascota.nombre}
            className="max-h-[48vh] w-auto object-contain"
            loading="lazy"
          />
        </div>
        <div>
          <h2 className="text-xl font-bold">{mascota.nombre}</h2>
          <div className="text-sm text-muted-foreground">{mascota.tipo} • {mascota.fecha_publicacion}</div>
        </div>
        <div className="text-sm text-[#716040]">{mascota.descripcion}</div>
        <div className="text-sm text-[#716040]"><strong>Lugar:</strong> {mascota.lugar_desaparicion}</div>
        <div className="flex gap-2 pt-2">
          <Button variant="solid" size="md">Contactar</Button>
          <Button variant="ghost" size="md" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
}

export default Principal;