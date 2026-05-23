import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { fetchMascotas, fetchResolvedMascotas } from "../services/principalService";
import * as adminService from "../services/adminService";
import type { Mascota } from "../types/mascota";
import { normalizeImage } from "@/lib/imageUtils";
import { Button, PetCard, Card } from "../components/ui";
import Modal from "../components/ui/Modal";
import Principal, { PrincipalModal } from "./Principal";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const isAdmin = hasRole && hasRole('ROLE_ADMIN');
  const [all, setAll] = useState<Mascota[]>([]);
  const [resolved, setResolved] = useState<Mascota[]>([]);
  const [selected, setSelected] = useState<Mascota | null>(null);
  const [selectedIsResolved, setSelectedIsResolved] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, any> | null>(null);
  const [reported, setReported] = useState<any[]>([]);
  const [hiddenList, setHiddenList] = useState<any[]>([]);
  const [deletedList, setDeletedList] = useState<any[]>([]);
  const [loadingReported, setLoadingReported] = useState(false);
  const [loadingHidden, setLoadingHidden] = useState(false);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<any | null>(null);
  const [restoreMotivo, setRestoreMotivo] = useState('');
  const [restoring, setRestoring] = useState(false);

  function readMetric(obj: Record<string, any> | null, candidates: string[]) {
    if (!obj) return undefined;
    for (const k of candidates) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
  }

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

    // admin-only loads
    if (isAdmin && user?.id) {
      setLoadingMetrics(true);
      adminService.getMetrics(String(user.id))
        .then(m => { if (!mounted) return; setMetrics(m || null); })
        .catch(() => {})
        .finally(() => { if (!mounted) return; setLoadingMetrics(false); });

      setLoadingReported(true);
      adminService.listReported(String(user.id), 0, 50)
        .then(list => { if (!mounted) return; setReported(Array.isArray(list) ? list : []); })
        .catch(() => {})
        .finally(() => { if (!mounted) return; setLoadingReported(false); });

      setLoadingHidden(true);
      adminService.listHiddenPublications(String(user.id), 0, 50)
        .then(list => { if (!mounted) return; setHiddenList(Array.isArray(list) ? list : []); })
        .catch(() => {})
        .finally(() => { if (!mounted) return; setLoadingHidden(false); });

      setLoadingDeleted(true);
      adminService.listDeletedPublications(String(user.id), 0, 50)
        .then(list => { if (!mounted) return; setDeletedList(Array.isArray(list) ? list : []); })
        .catch(() => {})
        .finally(() => { if (!mounted) return; setLoadingDeleted(false); });
    }

    return () => { mounted = false; };
  }, [isAdmin, user?.id]);

  const resolvedIds = useMemo(() => new Set(resolved.map(r => r.id)), [resolved]);

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
        {isAdmin && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Métricas de administración</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-white shadow flex flex-col border border-red-200">
                <div className="text-sm text-muted-foreground">Publicaciones Reportadas</div>
                <div className="text-2xl font-bold text-red-600">{loadingMetrics ? '—' : (readMetric(metrics, ['total_Publicaciones_Reportadas','totalPublicacionesReportadas','total_reported','reported_count']) ?? '0')}</div>
                <div className="text-sm text-red-500 mt-2">Requiere atención inmediata</div>
              </div>
              <div className="p-4 rounded-lg bg-white shadow flex flex-col">
                <div className="text-sm text-muted-foreground">Total Publicaciones</div>
                <div className="text-2xl font-bold">{loadingMetrics ? '—' : (readMetric(metrics, ['total_Publicaciones','totalPublicaciones','total_publicaciones','total_publications','totalPublications']) ?? '0')}</div>
                <div className="text-sm text-green-600 mt-2">{readMetric(metrics, ['publicationsChange','publications_change','publicationsDelta']) ?? ''}</div>
              </div>
              <div className="p-4 rounded-lg bg-white shadow flex flex-col">
                <div className="text-sm text-muted-foreground">Publicaciones Resueltas</div>
                <div className="text-2xl font-bold">{loadingMetrics ? '—' : (readMetric(metrics, ['total_Publicaciones_Resueltas','totalPublicacionesResueltas','total_resolved']) ?? '0')}</div>
                <div className="text-sm text-green-600 mt-2">{readMetric(metrics, ['resolvedChange','resolved_change']) ?? ''}</div>
              </div>
              <div className="p-4 rounded-lg bg-white shadow flex flex-col">
                <div className="text-sm text-muted-foreground">Reportes Pendientes</div>
                <div className="text-2xl font-bold">{loadingMetrics ? '—' : (readMetric(metrics, ['reports_Pendientes','reportsPendientes','pendingReports','pending_reports']) ?? '0')}</div>
                <div className="text-sm text-green-600 mt-2">{readMetric(metrics, ['reportsChange','reports_change']) ?? ''}</div>
              </div>
            </div>
          </div>
        )}
       <div className="mb-6">
          <p className="text-sm text-muted-foreground">Las publicaciones activas son aquellas que aún no han sido marcadas como resueltas por sus propietarios.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isAdmin && (
            <section>
              {/** show count from reported array or metrics as fallback */}
              {(() => {
                const metricCount = Number(readMetric(metrics, ['total_Publicaciones_Reportadas','totalPublicacionesReportadas','total_reported','reported_count']) ?? 0);
                const reportedCount = reported.length || metricCount;
                return (
                  <h3 className="text-lg font-bold mb-3">Publicaciones reportadas ({reportedCount})</h3>
                );
              })()}
              <div className="space-y-3">
                {loadingReported ? (
                  <div>Cargando reportes...</div>
                ) : reported.length === 0 ? (
                  <div>
                    <div className="text-sm text-muted-foreground">No hay reportes pendientes detallados.</div>
                    {Number(readMetric(metrics, ['total_Publicaciones_Reportadas','totalPublicacionesReportadas']) ?? 0) > 0 && (
                      <div className="text-sm text-amber-600">Nota: hay reportes registrados en métricas pero la lista de detalles está vacía.</div>
                    )}
                  </div>
                ) : (
                  reported.map((r: any) => {
                    const id = String(r.reportId);
                    const petId = String(r.petId ?? r.pet_id ?? '');
                    const ownerId = String(r.userId ?? r.user_id ?? r.usuarioId ?? r.usuario_id ?? '');
                    const tipo = r.tipoReporte ?? r.tipo_reporte ?? r.tipo ?? 'Reporte';
                    const fecha = r.fechaCreacion ?? r.fecha_creacion ?? r.createdAt ?? r.created_at;
                    const fechaPublicacionReportada = r.lastReportAt ?? r.last_report_at ?? r.fechaPublicacionReporte ?? r.fecha_publicacion_reporte ?? r.fecha_reporte ?? r.lastReport ?? null;
                    const reportCount = typeof r.reportCount === 'number' ? r.reportCount : (r.report_count ?? 0);
                    const thumbnail = normalizeImage(r.thumbnailUrl ?? r.thumbnail_url ?? r.imagenUrl ?? r.imagen_url ?? '');
                    const publisherName = r.publisherName ?? r.publisher_name ?? r.publisher ?? '—';
                    const reporterName = r.reporterName ?? r.reporter_name ?? r.reporter ?? '—';
                    const reporterReason = r.reporterReason ?? r.reporter_reason ?? r.reporterReason ?? '—';

                    // Resolve pet name and status: prefer DTO fields (`r.petName`, `r.tipoReporte`), fallback to local `all` data
                    const pet = all.find(a => String(a.id) === String(petId));
                    const petName = r.petName ?? pet?.nombre ?? r.nombreMascota ?? `Publicación ${petId}`;
                    const petStatus = String(r.tipoReporte ?? r.tipo_reporte ?? '').toLowerCase().includes('perd')
                      ? 'PERDIDO'
                      : (pet?.estado ? (String(pet.estado).toLowerCase().includes('perd') ? 'PERDIDO' : 'ENCONTRADO') : '');

                    return (
                      <Card key={id} className="p-3">
                        <div className="flex gap-4 items-start">
                          <img src={thumbnail} alt="mascota" className="h-24 w-24 rounded object-cover" />
                          <div className="flex-1">
                            <div className="font-semibold text-lg">{petName}{petStatus ? ` - ${petStatus}` : ''}</div>
                            <div className="text-sm text-muted-foreground">Publicado por: <span className="font-medium">{publisherName}</span></div>
                            <div className="text-sm text-muted-foreground">Reportado por: <span className="font-medium">{reporterName}</span></div>
                            <div className="text-sm text-muted-foreground">Motivo: <span className="font-medium">{reporterReason}</span></div>
                            {reportCount > 0 && <div className="text-xs text-muted-foreground mt-1">Veces reportada: {reportCount}</div>}
                            {fecha && <div className="text-xs text-muted-foreground">Fecha reporte: {new Date(fecha).toLocaleString()}</div>}
                            {fechaPublicacionReportada && <div className="text-xs text-muted-foreground">Fecha publicación reportada: {new Date(fechaPublicacionReportada).toLocaleString()}</div>}
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button className="px-3 py-1 bg-yellow-100 rounded" onClick={async () => {
                            const motivo = window.prompt('Motivo para ocultar publicación (opcional):') ?? '';
                            try { await adminService.ocultarPublicacion(String(user?.id), String(id), motivo); alert('Publicación ocultada');
                              setReported((prev) => prev.filter(x => String(x.reportId ?? x.id ?? x.report_id ?? '') !== id));
                            } catch (e) { alert(String(e)); }
                          }}>Ocultar</button>
                          <button className="px-3 py-1 bg-red-100 rounded" onClick={async () => {
                            if (!window.confirm('¿Eliminar publicación definitivamente?')) return;
                            const motivo = window.prompt('Motivo para eliminar (opcional):') ?? '';
                            try { await adminService.eliminarPublicacion(String(user?.id), String(id), motivo); alert('Publicación eliminada');
                              setReported((prev) => prev.filter(x => String(x.reportId ?? x.id ?? x.report_id ?? '') !== id));
                            } catch (e) { alert(String(e)); }
                          }}>Eliminar</button>
                          <button className="px-3 py-1 bg-gray-100 rounded" onClick={async () => {
                            const motivo = window.prompt('Motivo para ignorar reporte (opcional):') ?? '';
                            try { await adminService.ignorarReporte(String(user?.id), String(id), motivo); alert('Reporte ignorado');
                              setReported((prev) => prev.filter(x => String(x.reportId ?? x.id ?? x.report_id ?? '') !== id));
                            } catch (e) { alert(String(e)); }
                          }}>Ignorar</button>
                          <button className="px-3 py-1 bg-pink-100 rounded" onClick={async () => {
                            if (!ownerId) { alert('No se conoce el usuario propietario'); return; }
                            if (!window.confirm('Bloquear/desactivar al usuario propietario?')) return;
                            try {
                              const res = await fetch(`${(import.meta.env.VITE_API_URL as string) || 'http://localhost:8080'}/api/admin/users/${ownerId}/deactivate`, {
                                method: 'POST', headers: { 'X-User-Id': String(user?.id), 'Content-Type': 'application/json' }
                              });
                              if (!res.ok) throw new Error(await res.text());
                              alert('Usuario bloqueado/desactivado');
                            } catch (e) { alert(String(e)); }
                          }}>Bloquear usuario</button>
                        </div>
                      </Card>
                    );
                  })
                )}
                <div>
                  <Button variant="ghost" size="sm" onClick={async () => {
                    try {
                      const h = await adminService.moderationHistory(String(user?.id), 0, 50);
                      setHistory(Array.isArray(h) ? h : []);
                      setShowHistory(true);
                    } catch (e) { alert(String(e)); }
                  }}>Ver historial de moderación</Button>
                </div>
              </div>
            </section>
          )}
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
              {loadingHidden ? (
                <div className="text-sm text-muted-foreground">Cargando publicaciones ocultas...</div>
              ) : hiddenList.length === 0 ? null : (
                <div className="mt-4">
                  <h4 className="text-md font-semibold mb-2">Publicaciones ocultas</h4>
                  <div className="space-y-2">
                    {hiddenList.map((h: any) => {
                      const thumb = normalizeImage(h.thumbnailUrl ?? h.thumbnail_url ?? h.imagenUrl ?? h.imagen_url ?? h.image ?? '');
                      const title = h.petName ?? h.nombre ?? h.nombreMascota ?? h.name ?? `Publicación ${String(h.petId ?? h.pet_id ?? '')}`;
                      const pub = h.publisherName ?? h.publisher_name ?? h.publisher ?? '—';
                      const time = h.fechaCreacion ?? h.fecha_creacion ?? h.createdAt ?? h.created_at ?? '';
                      return (
                        <Card
                          key={String(h.reportId ?? h.id ?? h.report_id ?? h.publicationId ?? h.id)}
                          className="p-3 flex gap-3 items-start cursor-pointer"
                          onClick={() => { setRestoreTarget(h); setRestoreMotivo(''); setRestoreOpen(true); }}
                        >
                          <img src={thumb} alt="miniatura" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{title}</div>
                            <div className="text-xs text-muted-foreground">Publicado por: <span className="font-medium">{pub}</span></div>
                            {time && <div className="text-xs text-muted-foreground">{new Date(time).toLocaleString()}</div>}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
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
              {loadingDeleted ? (
                <div className="text-sm text-muted-foreground">Cargando publicaciones eliminadas...</div>
              ) : deletedList.length === 0 ? null : (
                <div className="mt-4">
                  <h4 className="text-md font-semibold mb-2">Publicaciones eliminadas</h4>
                  <div className="space-y-2">
                    {deletedList.map((d: any) => {
                      const thumb = normalizeImage(d.thumbnailUrl ?? d.thumbnail_url ?? d.imagenUrl ?? d.imagen_url ?? d.image ?? '');
                      const title = d.petName ?? d.nombre ?? d.nombreMascota ?? d.name ?? `Publicación ${String(d.petId ?? d.pet_id ?? '')}`;
                      const pub = d.publisherName ?? d.publisher_name ?? d.publisher ?? '—';
                      const time = d.fechaCreacion ?? d.fecha_creacion ?? d.createdAt ?? d.created_at ?? '';
                      return (
                        <Card key={String(d.reportId ?? d.id ?? d.report_id ?? d.publicationId ?? d.id)} className="p-3 flex gap-3 items-start">
                          <img src={thumb} alt="miniatura" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{title}</div>
                            <div className="text-xs text-muted-foreground">Publicado por: <span className="font-medium">{pub}</span></div>
                            {time && <div className="text-xs text-muted-foreground">{new Date(time).toLocaleString()}</div>}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {showHistory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold">Historial de moderación</h4>
              <button className="px-2 py-1" onClick={() => setShowHistory(false)}>Cerrar</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-auto">
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay acciones registradas.</div>
              ) : (
                history.map((h, idx) => (
                  <div key={idx} className="p-2 border rounded">
                    <div className="text-sm font-semibold">{h.action ?? h.tipo ?? 'Acción'}</div>
                    <div className="text-xs text-muted-foreground">{h.detail ?? h.descripcion ?? JSON.stringify(h)}</div>
                    <div className="text-xs text-muted-foreground">{h.actorId ? `Por: ${h.actorId}` : ''} {h.fecha ? ` • ${h.fecha}` : ''}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Modal open={restoreOpen} onClose={() => { if (!restoring) setRestoreOpen(false); }}>
        {restoreTarget ? (
          <div>
            <h4 className="font-bold mb-2">Restaurar publicación</h4>
            <div className="mb-2 text-sm">{(restoreTarget.petName ?? restoreTarget.nombre ?? restoreTarget.name) || `Publicación ${String(restoreTarget.petId ?? restoreTarget.pet_id ?? '')}`}</div>
            <label className="text-xs text-muted-foreground">Motivo (opcional)</label>
            <textarea value={restoreMotivo} onChange={(e) => setRestoreMotivo(e.target.value)} className="w-full border rounded p-2 mt-1 mb-3" rows={3} />
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 bg-white border rounded" onClick={() => setRestoreOpen(false)} disabled={restoring}>Cancelar</button>
              <button className="px-3 py-1 bg-green-100 rounded" onClick={async () => {
                if (!user?.id) { alert('Usuario no autenticado'); return; }
                const id = String(restoreTarget.reportId ?? restoreTarget.id ?? restoreTarget.report_id ?? restoreTarget.publicationId ?? restoreTarget.id ?? '');
                if (!id) { alert('No se encontró reportId'); return; }
                setRestoring(true);
                try {
                  await adminService.restaurarPublicacion(String(user.id), id, restoreMotivo ?? '');
                  // remove from hidden list
                  setHiddenList(prev => prev.filter(x => String(x.reportId ?? x.id ?? x.report_id ?? x.publicationId ?? x.id) !== id));
                  alert('Publicación restaurada');
                  setRestoreOpen(false);
                } catch (e) {
                  alert(String(e));
                } finally { setRestoring(false); }
              }} disabled={restoring}>{restoring ? 'Restaurando...' : 'Restaurar'}</button>
            </div>
          </div>
        ) : null}
      </Modal>

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
