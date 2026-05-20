import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { fetchMascotas, fetchResolvedMascotas } from "../services/principalService";
import type { Mascota } from "../types/mascota";
import { normalizeImage } from "@/lib/imageUtils";
import { Button, PetCard } from "../components/ui";
import Principal, { PrincipalModal } from "./Principal";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const [all, setAll] = useState<Mascota[]>([]);
  const [resolved, setResolved] = useState<Mascota[]>([]);
  const [selected, setSelected] = useState<Mascota | null>(null);
  const [selectedIsResolved, setSelectedIsResolved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    let mounted = true;
    fetchMascotas()
      .then((data) => { if (!mounted) return; setAll(data || []); })
      .catch(() => {});
    fetchResolvedMascotas()
      .then((data) => { if (!mounted) return; setResolved(data || []); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const resolvedIds = useMemo(() => new Set(resolved.map(r => r.id)), [resolved]);

  const isAdmin = hasRole && hasRole('ROLE_ADMIN');

  const visibleAll = useMemo(() => {
    if (!user || !user.id) return [] as Mascota[];
    if (isAdmin) return all;
    return all.filter(a => String(a.userid) === String(user.id));
  }, [all, user, isAdmin]);

  const visibleResolved = useMemo(() => {
    if (!user || !user.id) return [] as Mascota[];
    if (isAdmin) return resolved;
    return resolved.filter(r => String(r.userid) === String(user.id));
  }, [resolved, user, isAdmin]);

  const activeList = visibleAll.filter(a => !resolvedIds.has(a.id));

  return (
    <div className="min-h-screen bg-[#f5f1ea] text-[#020826] p-4 sm:p-6">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#020826] text-white">
              <img src="/assets/huellas.svg" alt="logo" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-semibold">Red de Patitas</p>
              <div className="text-sm text-muted-foreground font-bold">Dashboard de publicaciones</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Volver
          </Button>
        </div>
       <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? 'Administrador: en esta sección podrás ver todas las publicaciones y generar acciones de auditoría.'
              : 'En esta sección puedes ver tus publicaciones activas y resueltas.'}
          </p>
        </div>
       <div className="mb-6">
          <p className="text-sm text-muted-foreground">Las publicaciones activas son aquellas que aún no han sido marcadas como resueltas por sus propietarios.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section>
            <h3 className="text-lg font-bold mb-3">Publicaciones activas</h3>
            <div className="space-y-3">
              {activeList.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay publicaciones activas.</div>
              ) : (
                activeList.map(p => (
                  <PetCard
                    key={p.id}
                    pet={{
                      name: p.nombre,
                      status: (p.estado || '').toLowerCase().includes('perd') ? ('PERDIDO' as const) : ('ENCONTRADO' as const),
                      description: p.descripcion || '',
                      time: p.fecha_publicacion || '',
                      location: p.lugar_desaparicion || '',
                      image: normalizeImage(p.thumbnail_url),
                      backupImage: normalizeImage(p.imagen_url),
                    }}
                    onClick={() => {
                      setSelected(p);
                      setSelectedIsResolved(resolvedIds.has(p.id));
                    }}
                  />
                ))
              )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-3">Publicaciones resueltas</h3>
            <div className="space-y-3">
              {visibleResolved.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay publicaciones resueltas.</div>
              ) : (
                visibleResolved.map(p => (
                  <PetCard
                    key={p.id}
                    pet={{
                      name: p.nombre,
                      status: (p.estado || '').toLowerCase().includes('perd') ? ('PERDIDO' as const) : ('ENCONTRADO' as const),
                      description: p.descripcion || '',
                      time: p.fecha_publicacion || '',
                      location: p.lugar_desaparicion || '',
                      image: normalizeImage(p.thumbnail_url),
                      backupImage: normalizeImage(p.imagen_url),
                    }}
                    onClick={() => {
                      setSelected(p);
                      setSelectedIsResolved(true);
                    }}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <PrincipalModal
        mascota={selected}
        onClose={() => { setSelected(null); setSelectedIsResolved(false); }}
        hideContact={Boolean(selected && (selectedIsResolved || String(selected.userid) === String(user?.id)))}
        hideReport={Boolean(selected && (selectedIsResolved || String(selected.userid) === String(user?.id)))}
        hideResolve={Boolean(selected && selectedIsResolved)}
      />
    </div>
  );
}
