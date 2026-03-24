import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// map primitives are used inside MapWithSearch
import { Star, Navigation, Clock, ExternalLink } from "lucide-react";
import { Avatar, Chip, PetCard, Pet, SideNav, Button, Badge, Card } from "../components/ui";
import MapWithSearch from "../components/ui/MapWithSearch";
import { assets, normalizeImage } from "@/lib/imageUtils";
import Modal from "../components/ui/Modal";
import type { Mascota } from "../types/mascota";
import { fetchMascotas } from "../services/mascotaService";

// image utils moved to src/lib/imageUtils.ts

const navItems = [
  // {
  //   label: "Principal",
  //   active: true,
  //   icon: (
  //     <svg className="h-5 w-5 text-[#8c7851]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //       <path d="M3 13h6v8H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  //       <path d="M15 3h6v18h-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  //     </svg>
  //   ),
  // },
  {
    label: "Publicar Mascota",
    to: "/reportar",
    icon: (
      <svg className="h-5 w-5 text-[#8c7851]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
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

// MyMap moved to src/components/ui/MapWithSearch.tsx


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
          {/* Top bar removed (search moved into map). */}

          {/* Área de contenido: lista a la izquierda y mapa a la derecha */}
          <div className="flex-1 flex gap-6 px-4 md:px-6 pb-6">
            {/* Lista de reportes (desktop) */}
            <div className="hidden lg:flex w-auto max-w-[360px] flex-col">
              <div className="mb-4 mt-6 flex items-center justify-between px-16">
                <h3 className="text-lg font-bold">Mascotas en la zona</h3>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-80px)] pr-2">
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
                  <MapWithSearch
                    mascotas={mascotas}
                    onVisibleChange={setVisibleMascotas}
                    onSelectMascota={setSelectedMascota}
                  />
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
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.onerror = null;
              img.src = assets.max;
            }}
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