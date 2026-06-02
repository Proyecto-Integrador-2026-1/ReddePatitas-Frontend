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
  const [userMetrics, setUserMetrics] = useState<Record<string, any> | null>(null);
  const [reported, setReported] = useState<any[]>([]);
  const [hiddenList, setHiddenList] = useState<any[]>([]);
  const [deletedList, setDeletedList] = useState<any[]>([]);
  const [loadingReported, setLoadingReported] = useState(false);
  const [loadingHidden, setLoadingHidden] = useState(false);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingUserMetrics, setLoadingUserMetrics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<any | null>(null);
  const [restoreMotivo, setRestoreMotivo] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<string | null>(null);
  const [confirmPayload, setConfirmPayload] = useState<any | null>(null);
  const [confirmMotivo, setConfirmMotivo] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [userActionsOpen, setUserActionsOpen] = useState(false);
  const [userActionsPayload, setUserActionsPayload] = useState<any | null>(null);
  const [userActionsMotivo, setUserActionsMotivo] = useState('');
  const [userActionsLoading, setUserActionsLoading] = useState(false);
  const [userActionConfirmOpen, setUserActionConfirmOpen] = useState(false);
  const [userActionToPerform, setUserActionToPerform] = useState<'block' | 'unblock' | 'deactivate' | 'activate' | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [userReported, setUserReported] = useState<any[]>([]);
  const [userHidden, setUserHidden] = useState<any[]>([]);
  const [userDeleted, setUserDeleted] = useState<any[]>([]);
  const [loadingUserStatus, setLoadingUserStatus] = useState(false);

  function readMetric(obj: Record<string, any> | null, candidates: string[]) {
    if (!obj) return undefined;
    for (const k of candidates) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
  }

  function petNameOrSinNombre(item: any) {
    const n = String(item?.petName ?? item?.pet_name ?? item?.nombre ?? item?.nombreMascota ?? item?.nombre_mascota ?? item?.name ?? item?.title ?? '').trim();
    return n || 'sin nombre';
  }

  async function performUserAction(action: 'block' | 'unblock' | 'deactivate' | 'activate') {
    if (!userActionsPayload) return;
    const ownerId = String(userActionsPayload.ownerId);
    setUserActionsLoading(true);
    try {
      if (action === 'block') await adminService.blockUser(ownerId, userActionsMotivo || '');
      if (action === 'unblock') await adminService.unblockUser(ownerId, userActionsMotivo || '');
      if (action === 'deactivate') await adminService.deactivateUser(ownerId, userActionsMotivo || '');
      if (action === 'activate') await adminService.activateUser(ownerId, userActionsMotivo || '');
      setFlashMessage(`Acción ${action} ejecutada`);
      setUserActionsOpen(false);
    } catch (e) {
      setFlashMessage(String(e));
    } finally {
      setUserActionsLoading(false);
      setUserActionsMotivo('');
      setUserActionsPayload(null);
    }
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

      // load user metrics
      setLoadingUserMetrics(true);
      adminService.getUserMetrics(String(user.id))
        .then(m => { if (!mounted) return; setUserMetrics(m || null); })
        .catch(() => {})
        .finally(() => { if (!mounted) return; setLoadingUserMetrics(false); });
    }

    return () => { mounted = false; };
  }, [isAdmin, user?.id]);

  // load personal reported/hidden/deleted lists for non-admin authenticated users
  useEffect(() => {
    let mounted = true;
    if (!user?.id || isAdmin) return;
    const uid = String(user.id);
    setLoadingUserStatus(true);
    Promise.all([
      adminService.listReported(uid, 0, 50).catch(() => []),
      adminService.listHiddenPublications(uid, 0, 50).catch(() => []),
      adminService.listDeletedPublications(uid, 0, 50).catch(() => []),
    ]).then(([rep, hid, del]) => {
      if (!mounted) return;
      // filter results by ownership for safety
      const extractOwnerId = (it: any) => String(it.userId ?? it.user_id ?? it.usuarioId ?? it.usuario_id ?? it.publisherId ?? it.publisher_id ?? it.ownerId ?? it.owner_id ?? it.userid ?? it.user ?? '');
      const makeArray = (x: any) => Array.isArray(x) ? x : [];
      let repArr = makeArray(rep).filter((r: any) => extractOwnerId(r) === uid || String(r.publisherId ?? r.publisher_id ?? r.usuarioId ?? r.usuario_id ?? '') === uid);
      let hidArr = makeArray(hid).filter((h: any) => extractOwnerId(h) === uid || String(h.publisherId ?? h.publisher_id ?? h.usuarioId ?? h.usuario_id ?? '') === uid);
      let delArr = makeArray(del).filter((d: any) => extractOwnerId(d) === uid || String(d.publisherId ?? d.publisher_id ?? d.usuarioId ?? d.usuario_id ?? '') === uid);
      setUserReported(repArr);
      setUserHidden(hidArr);
      setUserDeleted(delArr);
    }).catch((e) => {
      if (!mounted) return;
      setFlashMessage(String(e));
    }).finally(() => { if (mounted) setLoadingUserStatus(false); });
    return () => { mounted = false; };
  }, [user?.id, isAdmin]);

  const renderUserPersonalLists = () => {
    if (loadingUserStatus) return <div className="text-sm text-muted-foreground mt-3">Cargando estado de mis publicaciones...</div>;
    return (
      <>
        {userReported.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2">Mis publicaciones reportadas</h4>
            <div className="space-y-2">
              {userReported.map((r: any, idx) => (
                <Card key={idx} className="p-3">
                  <div className="flex gap-3 items-start">
                    <img src={normalizeImage(r.thumbnailUrl ?? r.thumbnail_url ?? r.imagenUrl ?? r.imagen_url ?? '')} alt="mini" className="h-12 w-12 sm:h-16 sm:w-16 rounded object-cover flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{petNameOrSinNombre(r)}</div>
                      {r.fechaCreacion && <div className="text-xs text-muted-foreground">{new Date(r.fechaCreacion).toLocaleString()}</div>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {userHidden.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2">Mis publicaciones ocultas</h4>
            <div className="space-y-2">
              {userHidden.map((h: any, idx) => {
                const tipoRaw = String(h.tipoReporte ?? h.tipo_reporte ?? h.tipo ?? '').toLowerCase();
                const tipoLabel = tipoRaw.includes('perd') ? 'PERDIDO' : (tipoRaw.includes('encon') || tipoRaw.includes('encontr') ? 'ENCONTRADO' : '');
                return (
                  <Card key={idx} className="p-3">
                    <div className="flex gap-3 items-start">
                      <img src={normalizeImage(h.thumbnailUrl ?? h.thumbnail_url ?? h.imagenUrl ?? h.imagen_url ?? h.image ?? '')} alt="mini" className="h-12 w-12 sm:h-16 sm:w-16 rounded object-cover flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{petNameOrSinNombre(h)}</div>
                        {tipoLabel && <div className="text-xs text-muted-foreground">Tipo: <span className="font-medium">{tipoLabel}</span></div>}
                        {h.fechaCreacion && <div className="text-xs text-muted-foreground">{new Date(h.fechaCreacion).toLocaleString()}</div>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {userDeleted.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2">Mis publicaciones eliminadas</h4>
            <div className="space-y-2">
              {userDeleted.map((d: any, idx) => {
                const tipoRaw = String(d.tipoReporte ?? d.tipo_reporte ?? d.tipo ?? '').toLowerCase();
                const tipoLabel = tipoRaw.includes('perd') ? 'PERDIDO' : (tipoRaw.includes('encon') || tipoRaw.includes('encontr') ? 'ENCONTRADO' : '');
                return (
                  <Card key={idx} className="p-3">
                    <div className="flex gap-3 items-start">
                      <img src={normalizeImage(d.thumbnailUrl ?? d.thumbnail_url ?? d.imagenUrl ?? d.imagen_url ?? d.image ?? '')} alt="mini" className="h-12 w-12 sm:h-16 sm:w-16 rounded object-cover flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{petNameOrSinNombre(d)}</div>
                        {tipoLabel && <div className="text-xs text-muted-foreground">Tipo: <span className="font-medium">{tipoLabel}</span></div>}
                        {d.fechaCreacion && <div className="text-xs text-muted-foreground">{new Date(d.fechaCreacion).toLocaleString()}</div>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  // auto-clear flash messages
  useEffect(() => {
    if (!flashMessage) return;
    const t = setTimeout(() => setFlashMessage(null), 3000);
    return () => clearTimeout(t);
  }, [flashMessage]);

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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
          {/* user's personal lists are shown inline below Active publications */}
        </div>
        {isAdmin && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Métricas de reportes</h3>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
              <div className="p-4 rounded-lg bg-white shadow flex flex-col items-center justify-center text-center border border-red-200">
                <div className="text-sm text-muted-foreground text-center font-bold">Publicaciones Reportadas</div>
                <div className="text-2xl font-bold text-red-600 text-center">{loadingMetrics ? '—' : (readMetric(metrics, ['total_Publicaciones_Reportadas','totalPublicacionesReportadas','total_reported','reported_count']) ?? '0')}</div>
                <div className="text-sm text-red-500 mt-2">Requiere atención inmediata</div>
              </div>
              <div className="p-4 rounded-lg bg-white shadow flex flex-col items-center justify-center text-center">
                <div className="text-sm text-muted-foreground text-center font-bold">Total Publicaciones</div>
                <div className="text-2xl font-bold text-center">{loadingMetrics ? '—' : (readMetric(metrics, ['total_Publicaciones','totalPublicaciones','total_publicaciones','total_publications','totalPublications']) ?? '0')}</div>
                <div className="text-sm text-green-600 mt-2">{readMetric(metrics, ['publicationsChange','publications_change','publicationsDelta']) ?? ''}</div>
              </div>
              <div className="p-4 rounded-lg bg-white shadow flex flex-col items-center justify-center text-center">
                <div className="text-sm text-muted-foreground text-center font-bold">Publicaciones Resueltas</div>
                <div className="text-2xl font-bold text-center">{loadingMetrics ? '—' : (readMetric(metrics, ['total_Publicaciones_Resueltas','totalPublicacionesResueltas','total_resolved']) ?? '0')}</div>
                <div className="text-sm text-green-600 mt-2">{readMetric(metrics, ['resolvedChange','resolved_change']) ?? ''}</div>
              </div>
              <div className="p-4 rounded-lg bg-white shadow flex flex-col items-center justify-center text-center">
                <div className="text-sm text-muted-foreground text-center font-bold">Reportes Pendientes</div>
                <div className="text-2xl font-bold text-center">{loadingMetrics ? '—' : (readMetric(metrics, ['reports_Pendientes','reportsPendientes','pendingReports','pending_reports']) ?? '0')}</div>
                <div className="text-sm text-green-600 mt-2">{readMetric(metrics, ['reportsChange','reports_change']) ?? ''}</div>
              </div>
              <div className="p-4 rounded-lg bg-white shadow flex flex-col items-center justify-center text-center">
                <div className="text-sm text-muted-foreground text-center font-bold">Publicaciones Ocultas</div>
                <div className="text-2xl font-bold text-center">{loadingMetrics ? '—' : (readMetric(metrics, ['total_Publicaciones_Ocultas','totalPublicacionesOcultas','total_hidden']) ?? '0')}</div>  
              </div>
              <div className="p-4 rounded-lg bg-white shadow flex flex-col items-center justify-center text-center">
                <div className="text-sm text-muted-foreground text-center font-bold">Publicaciones Eliminadas</div>
                <div className="text-2xl font-bold text-center">{loadingMetrics ? '—' : (readMetric(metrics, ['total_Publicaciones_Eliminadas','totalPublicacionesEliminadas','total_deleted']) ?? '0')}</div>
                <div className="text-sm text-amber-600 mt-2">Histórico de publicaciones eliminadas</div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-lg font-bold mb-3">Métricas de usuarios</h4>
              <div className="text-xs text-muted-foreground mb-2">{loadingUserMetrics ? 'Cargando métricas de usuario...' : (userMetrics ? 'Métricas cargadas' : 'Sin métricas de usuario disponibles')}</div>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div className="p-4 rounded-lg bg-white shadow flex flex-col items-center justify-center text-center border border-gray-200">
                  <div className="text-sm text-muted-foreground text-center font-bold">Total Usuarios</div>
                  <div className="text-2xl font-bold text-center">{loadingUserMetrics ? '—' : (readMetric(userMetrics, ['totalUsers','total_Users']) ?? '0')}</div>
                </div>
                <div className="p-4 rounded-lg bg-white shadow flex flex-col items-center justify-center text-center">
                  <div className="text-sm text-muted-foreground text-center font-bold">Usuarios Activos</div>
                  <div className="text-2xl font-bold text-center">{loadingUserMetrics ? '—' : (readMetric(userMetrics, ['totalActive','total_Active']) ?? '0')}</div>
                </div>
                <div className="p-4 rounded-lg bg-white shadow flex flex-col items-center justify-center text-center">
                  <div className="text-sm text-muted-foreground text-center font-bold">Usuarios Bloqueados</div>
                  <div className="text-2xl font-bold text-center text-red-600">{loadingUserMetrics ? '—' : (readMetric(userMetrics, ['totalBlocked','total_Blocked']) ?? '0')}</div>
                </div>
                <div className="p-4 rounded-lg bg-white shadow flex flex-col items-center justify-center text-center">
                  <div className="text-sm text-muted-foreground text-center font-bold">Usuarios Desactivados</div>
                  <div className="text-2xl font-bold text-center">{loadingUserMetrics ? '—' : (readMetric(userMetrics, ['totalDeactivated','total_Deactivated']) ?? '0')}</div>
                </div>
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
                          <img src={thumbnail} alt="mascota" className="h-16 w-16 sm:h-24 sm:w-24 rounded object-cover flex-shrink-0" />
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
                          <button className="px-3 py-1 bg-yellow-100 rounded" onClick={() => {
                            setConfirmType('ocultar'); setConfirmPayload({ id, userId: String(user?.id) }); setConfirmMotivo(''); setConfirmOpen(true);
                          }}>Ocultar</button>
                          <button className="px-3 py-1 bg-red-100 rounded" onClick={() => {
                            setConfirmType('eliminar'); setConfirmPayload({ id, userId: String(user?.id) }); setConfirmMotivo(''); setConfirmOpen(true);
                          }}>Eliminar</button>
                          <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => {
                            setConfirmType('ignorar'); setConfirmPayload({ id, userId: String(user?.id) }); setConfirmMotivo(''); setConfirmOpen(true);
                          }}>Ignorar</button>
                          <button className="px-3 py-1 bg-pink-100 rounded" onClick={() => {
                            if (!ownerId) { setFlashMessage('No se conoce el usuario propietario'); return; }
                            setUserActionsPayload({ ownerId, userId: String(user?.id) }); setUserActionsMotivo(''); setUserActionsOpen(true);
                          }}>Acciones sobre el usuario</button>
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
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCleanupConfirmOpen(true)}
                  >
                    Eliminar reportes antiguos (más de 14 días)
                  </Button>
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
              {/* User's personal lists (reportadas/ocultas/eliminadas) shown inline for context */}
              {!isAdmin && renderUserPersonalLists()}
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
                      const tipoRaw = String(h.tipoReporte ?? h.tipo_reporte ?? h.tipo ?? '').toLowerCase();
                      const tipoLabel = tipoRaw.includes('perd') ? 'PERDIDO' : (tipoRaw.includes('encon') || tipoRaw.includes('encontr') ? 'ENCONTRADO' : '');
                      return (
                        <Card
                          key={String(h.reportId ?? h.id ?? h.report_id ?? h.publicationId ?? h.id)}
                          className="p-3 flex gap-3 items-start cursor-pointer"
                          onClick={() => { setRestoreTarget(h); setRestoreMotivo(''); setRestoreOpen(true); }}
                        >
                          <img src={thumb} alt="miniatura" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{title}</div>
                            {tipoLabel && <div className="text-xs text-muted-foreground">Tipo: <span className="font-medium">{tipoLabel}</span></div>}
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
                      const tipoRaw = String(d.tipoReporte ?? d.tipo_reporte ?? d.tipo ?? '').toLowerCase();
                      const tipoLabel = tipoRaw.includes('perd') ? 'PERDIDO' : (tipoRaw.includes('encon') || tipoRaw.includes('encontr') ? 'ENCONTRADO' : '');
                      return (
                        <Card key={String(d.reportId ?? d.id ?? d.report_id ?? d.publicationId ?? d.id)} className="p-3 flex gap-3 items-start">
                          <img src={thumb} alt="miniatura" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{title}</div>
                            {tipoLabel && <div className="text-xs text-muted-foreground">Tipo: <span className="font-medium">{tipoLabel}</span></div>}
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded max-w-lg sm:max-w-2xl w-full mx-2 sm:mx-0">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold">Historial de moderación</h4>
              <button className="px-2 py-1" onClick={() => setShowHistory(false)}>Cerrar</button>
            </div>
            <div className="max-h-96 overflow-auto">
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay acciones registradas.</div>
              ) : (
                <ul className="space-y-4">
                  {history.map((h, idx) => {
                    const tipo = String(h.tipoAccion ?? h.tipo ?? h.action ?? 'Acción');
                    const fecha = h.creadoEn ?? h.creado_en ?? h.creado ?? h.createdAt ?? h.created_at ?? null;
                    const fechaObj = fecha ? new Date(fecha) : null;
                    const fechaStr = fechaObj ? fechaObj.toLocaleString('es-AR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '—';
                    const quien = String(h.realizadoPorNombre ?? h.realizado_por ?? h.actor ?? h.user ?? '—');
                    const objetivo = String(h.idObjetivo ?? h.id_objetivo ?? h.idObjetiv ?? h.targetId ?? h.id ?? '—');
                    const motivo = h.motivo ?? h.reason ?? h.detail ?? '';
                    const l = tipo.toLowerCase();
                    let color = 'bg-gray-100 text-gray-800';
                    // report-related colors
                    if (l.includes('elim')) color = 'bg-red-100 text-red-800';
                    else if (l.includes('ocult')) color = 'bg-yellow-100 text-yellow-800';
                    else if (l.includes('restaur')) color = 'bg-green-100 text-green-800';
                    // user-related actions: check 'desbloq/unblock' before 'bloque/block' to avoid substring collisions
                    else if (l.includes('desbloq') || l.includes('unblock')) color = 'bg-green-100 text-green-800';
                    else if (l.includes('bloque') || l.includes('block')) color = 'bg-red-100 text-red-800';
                    else if (l.includes('desactiv') || l.includes('deactiv')) color = 'bg-yellow-100 text-yellow-800';
                    else if (l.includes('activ') || l.includes('activate')) color = 'bg-green-100 text-green-800';
                    return (
                      <li key={idx}>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-lg ring-1 ring-gray-100 hover:shadow-2xl transition-shadow flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="sm:w-36 w-full text-sm text-muted-foreground sm:text-right text-left whitespace-nowrap">{fechaStr}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-start gap-6">
                              <div className="flex items-center gap-3">
                                <div className={`px-2 py-1 rounded-full text-sm font-semibold ${color}`}>{tipo}</div>
                              </div>
                              <div className="text-xs text-muted-foreground">Por: <span className="font-medium">{quien}</span></div>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">Objetivo: <span className="font-medium text-[#020826] break-words">{objetivo}</span></div>
                            {motivo && <div className="mt-2 text-sm text-[#5c4e34]">Motivo: {String(motivo)}</div>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal open={restoreOpen} onClose={() => { if (!restoring) setRestoreOpen(false); }}>
        {restoreTarget ? (
          <div>
            <h4 className="font-bold mb-2">Restaurar publicación</h4>
            <div className="mb-2 text-sm">¿Está seguro de restaurar la publicación?</div>
            <label className="text-xs text-muted-foreground">Motivo (opcional)</label>
            <textarea value={restoreMotivo} onChange={(e) => setRestoreMotivo(e.target.value)} rows={3} className="w-full border border-gray-200 bg-white rounded-lg p-3 mt-1 mb-3 shadow-sm transition-colors resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300" />
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

      {/* Modal para acciones sobre el usuario (bloquear/desbloquear/desactivar/activar) */}
      <Modal open={userActionsOpen} onClose={() => { if (!userActionsLoading) setUserActionsOpen(false); }}>
        <div>
          <h4 className="font-bold mb-2">Acciones sobre el usuario</h4>
          <div className="mb-3 text-sm text-muted-foreground">Seleccione una acción a realizar sobre el usuario. Puede indicar un motivo (opcional).</div>
          <textarea value={userActionsMotivo} onChange={(e) => setUserActionsMotivo(e.target.value)} rows={3} placeholder="Motivo (opcional)" className="w-full border border-gray-200 bg-white rounded-lg p-3 mt-1 mb-3 shadow-sm transition-colors resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300" />
          <div className="flex gap-2 justify-end flex-wrap">
            <button className="px-3 py-1 bg-red-100 rounded" onClick={() => { setUserActionToPerform('block'); setUserActionConfirmOpen(true); }} disabled={userActionsLoading}>Bloquear</button>
            <button className="px-3 py-1 bg-green-100 rounded" onClick={() => { setUserActionToPerform('unblock'); setUserActionConfirmOpen(true); }} disabled={userActionsLoading}>Desbloquear</button>
            <button className="px-3 py-1 bg-yellow-100 rounded" onClick={() => { setUserActionToPerform('deactivate'); setUserActionConfirmOpen(true); }} disabled={userActionsLoading}>Desactivar</button>
            <button className="px-3 py-1 bg-blue-100 rounded" onClick={() => { setUserActionToPerform('activate'); setUserActionConfirmOpen(true); }} disabled={userActionsLoading}>Activar</button>
            <button className="px-3 py-1 bg-white border rounded" onClick={() => setUserActionsOpen(false)} disabled={userActionsLoading}>Cancelar</button>
          </div>
        </div>
      </Modal>

      {/* Confirmación por acción de usuario */}
      <Modal open={userActionConfirmOpen} onClose={() => { if (!userActionsLoading) setUserActionConfirmOpen(false); }}>
        <div>
          <h4 className="font-bold mb-2">Confirmar acción</h4>
          <div className="mb-3 text-sm text-muted-foreground">
            {(() => {
              if (!userActionToPerform) return 'Seleccione una acción.';
              const map: Record<string,string> = { block: 'bloquear', unblock: 'desbloquear', deactivate: 'desactivar', activate: 'activar' };
              return `¿Está seguro de ${map[userActionToPerform]} al usuario?`;
            })()}
          </div>
          <div className="flex gap-2 justify-end">
            <button className="px-3 py-1 bg-white border rounded" onClick={() => { if (!userActionsLoading) setUserActionConfirmOpen(false); }} disabled={userActionsLoading}>Cancelar</button>
            <button className="px-3 py-1 bg-red-100 rounded" onClick={async () => {
              if (!userActionToPerform) return;
              await performUserAction(userActionToPerform);
              setUserActionConfirmOpen(false);
            }} disabled={userActionsLoading}>{userActionsLoading ? 'Procesando...' : 'Confirmar'}</button>
          </div>
        </div>
      </Modal>

      {/* Confirmation modal for reported actions */}
      <Modal open={confirmOpen} onClose={() => { if (!confirmLoading) setConfirmOpen(false); }}>
        <div>
          <h4 className="font-bold mb-2">{confirmType === 'ocultar' ? 'Ocultar publicación' : confirmType === 'eliminar' ? 'Eliminar publicación' : confirmType === 'ignorar' ? 'Ignorar reporte' : confirmType === 'bloquear' ? 'Bloquear usuario' : 'Confirmar acción'}</h4>
          <div className="mb-3 text-sm text-muted-foreground">
            {confirmType === 'ocultar' && 'Confirma ocultar la publicación. Puedes indicar un motivo (opcional).'}
            {confirmType === 'eliminar' && 'Esta acción eliminará la publicación definitivamente. Indica un motivo (opcional).'}
            {confirmType === 'ignorar' && 'Confirmar que se ignorará este reporte. Puedes indicar un motivo (opcional).'}
            {confirmType === 'bloquear' && 'Confirma bloquear/desactivar al usuario propietario.'}
          </div>
          {(confirmType === 'ocultar' || confirmType === 'eliminar' || confirmType === 'ignorar') && (
            <textarea value={confirmMotivo} onChange={(e) => setConfirmMotivo(e.target.value)} rows={3} placeholder="Motivo (opcional)" className="w-full border border-gray-200 bg-white rounded-lg p-3 mt-1 mb-3 shadow-sm transition-colors resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300" />
          )}
          <div className="flex gap-2 justify-end">
            <button className="px-3 py-1 bg-white border rounded" onClick={() => { if (!confirmLoading) setConfirmOpen(false); }} disabled={confirmLoading}>Cancelar</button>
            <button className="px-3 py-1 bg-red-100 rounded" onClick={async () => {
              if (!confirmType || !confirmPayload) return;
              setConfirmLoading(true);
              try {
                if (confirmType === 'ocultar') {
                  await adminService.ocultarPublicacion(String(confirmPayload.userId), String(confirmPayload.id), confirmMotivo || '');
                  setReported(prev => prev.filter(x => String(x.reportId ?? x.id ?? x.report_id ?? '') !== String(confirmPayload.id)));
                  setFlashMessage('Publicación ocultada');
                } else if (confirmType === 'eliminar') {
                  await adminService.eliminarPublicacion(String(confirmPayload.userId), String(confirmPayload.id), confirmMotivo || '');
                  setReported(prev => prev.filter(x => String(x.reportId ?? x.id ?? x.report_id ?? '') !== String(confirmPayload.id)));
                  setFlashMessage('Publicación eliminada');
                } else if (confirmType === 'ignorar') {
                  await adminService.ignorarReporte(String(confirmPayload.userId), String(confirmPayload.id), confirmMotivo || '');
                  setReported(prev => prev.filter(x => String(x.reportId ?? x.id ?? x.report_id ?? '') !== String(confirmPayload.id)));
                  setFlashMessage('Reporte ignorado');
                } else if (confirmType === 'bloquear') {
                  const ownerId = String(confirmPayload.ownerId);
                  await adminService.blockUser(ownerId, confirmMotivo || '');
                  setFlashMessage('Usuario bloqueado/desactivado');
                }
                setConfirmOpen(false);
              } catch (e) {
                setFlashMessage(String(e));
              } finally {
                setConfirmLoading(false);
                setConfirmMotivo('');
                setConfirmType(null);
                setConfirmPayload(null);
              }
            }} disabled={confirmLoading}>{confirmLoading ? 'Procesando...' : 'Confirmar'}</button>
          </div>
        </div>
      </Modal>

      {/* Confirm modal for deleting old reports */}
      <Modal open={cleanupConfirmOpen} onClose={() => { if (!cleanupLoading) setCleanupConfirmOpen(false); }}>
        <div>
          <h4 className="font-bold mb-2">Eliminar reportes antiguos</h4>
          <div className="mb-3 text-sm text-muted-foreground">¿Confirma eliminar los reportes con más de 14 días? Esta acción no se puede deshacer.</div>
          <div className="flex gap-2 justify-end">
            <button className="px-3 py-1 bg-white border rounded" onClick={() => { if (!cleanupLoading) setCleanupConfirmOpen(false); }} disabled={cleanupLoading}>Cancelar</button>
            <button className="px-3 py-1 bg-red-100 rounded" onClick={async () => {
              setCleanupLoading(true);
              try {
                const res = await adminService.cleanupOldReports();
                const deleted = res?.deletedCount ?? res?.deleted ?? 0;
                setFlashMessage(res?.message ?? `Se eliminaron ${deleted} reportes antiguos`);
                setCleanupConfirmOpen(false);
              } catch (e) {
                setFlashMessage(String(e));
              } finally {
                setCleanupLoading(false);
              }
            }} disabled={cleanupLoading}>{cleanupLoading ? 'Procesando...' : 'Eliminar'}</button>
          </div>
        </div>
      </Modal>

      {/* flash message */}
      {flashMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-black text-white px-4 py-2 rounded">{flashMessage}</div>
        </div>
      )}

      

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
