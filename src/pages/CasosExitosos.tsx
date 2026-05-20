import React, { useEffect, useState } from "react";
import { PetCard } from "../components/ui";
import { useNavigate } from "react-router-dom";
import { fetchResolvedMascotas } from "../services/principalService";
import type { Mascota } from "../types/mascota";
import { normalizeImage } from "@/lib/imageUtils";
import Principal, { PrincipalModal } from "./Principal";
import { Button } from "../components/ui";

export default function CasosExitosos() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [selectedMascota, setSelectedMascota] = useState<Mascota | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchResolvedMascotas()
      .then((data) => {
        if (!mounted) return;
        setMascotas(data || []);
      })
      .catch((err) => console.error("Error fetching resolved mascotas:", err));
    return () => { mounted = false; };
  }, []);

  const formatShortDate = (value?: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(parsed);
  };

  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#f5f1ea] text-[#020826] p-4 sm:p-6">
      {/* Botón posicionado de forma absoluta */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          Volver
        </Button>
      </div>

      <div className="mx-auto max-w-screen-md">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#020826] text-white">
            <img src="/assets/huellas.svg" alt="logo" className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xl font-semibold">Red de Patitas</p>
            <div className="text-sm text-muted-foreground font-bold">Casos exitosos</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">Publicaciones marcadas como resueltas por sus propietarios.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mascotas.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay casos exitosos aún.</div>
          ) : (
            mascotas.map((pet) => {
              const status = (pet.estado || "").toLowerCase().includes("perd") ? ("PERDIDO" as const) : ("ENCONTRADO" as const);
              return (
                <PetCard
                  key={pet.id}
                  pet={{
                    name: pet.nombre,
                    status,
                    description: pet.descripcion || "",
                    time: formatShortDate(pet.fecha_publicacion),
                    location: pet.lugar_desaparicion || "",
                    image: normalizeImage(pet.thumbnail_url),
                    backupImage: normalizeImage(pet.imagen_url),
                  }}
                  onClick={() => setSelectedMascota(pet)}
                />
              );
            })
          )}
        </div>
      </div>

      <PrincipalModal
        mascota={selectedMascota}
        onClose={() => setSelectedMascota(null)}
        hideContact={true}
        hideReport={true}
        hideResolve={true}
      />
    </div>
  );
}
