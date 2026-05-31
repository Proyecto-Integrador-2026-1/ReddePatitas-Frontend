import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom"; // 👈 Añadir useSearchParams
// map primitives are used inside MapWithSearch
import { Star, Navigation, Clock, ExternalLink } from "lucide-react";
import { Avatar, Chip, PetCard, Pet, SideNav, Button, Badge, Card, Label } from "../components/ui";
import ReportModal from "../components/ui/ReportModal";
import MapWithSearch from "../components/ui/MapWithSearch";
import { MapFilters } from "../components/ui/MapFilters"; // 👈 Importar el componente de filtros
import { assets, normalizeImage } from "@/lib/imageUtils";
import Modal from "../components/ui/Modal";
import type { Mascota } from "../types/mascota";
import { fetchMascotas } from "../services/principalService";

import { useAuth } from '../hooks/useAuth';
import messagingService from '../services/mensajeriaService';
import websocketService from "../services/websocketService";
import reportService from '../services/reportPublicationService';
import reportsService from '../services/reportsService';
import { RoleGuard } from '../components/RoleGuard';

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
    to: "/reporte",
    authOnly: true,
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
  //   authOnly: true,
  //   icon: (
  //     <svg className="h-5 w-5 text-[#716040] overflow-visible" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //       <path d="M15 17H9a3 3 0 0 1-3-3V10a6 6 0 1 1 12 0v4a3 3 0 0 1-3 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  //       <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  //     </svg>
  //   ),
  // },
  {
    label: "Mensajes",
    to: "/conversations",
    authOnly: true,
    icon: (
      <svg className="h-5 w-5 text-[#716040]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H7l-4 4V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Mi Perfil",
    to: "/perfil",
    authOnly: true,
    icon: (
      <svg className="h-5 w-5 text-[#716040]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  // {
  //   label: "Configuración",
  //   icon: (
  //     <svg className="h-5 w-5 text-[#716040]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //       <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  //       <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.3 18.9l.06-.06c.5-.5.57-1.28.26-1.92A1.65 1.65 0 0 0 2.77 14a1.65 1.65 0 0 0-.33-1.82L2.38 11.9A2 2 0 1 1 5.2 9.07l.06.06c.5.5 1.28.57 1.92.26.64-.31 1.09-.95 1.09-1.67V6a2 2 0 1 1 4 0v.09c0 .72.45 1.36 1.09 1.67.64.31 1.42.24 1.92-.26l.06-.06A2 2 0 1 1 21.7 9.1l-.06.06c-.31.64-.24 1.42.26 1.92.6.6.84 1.5.59 2.34z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  //     </svg>
  //   ),
  // },
  {
    label: "Casos Exitosos",
    to: "/casos-exitosos",
    icon: (
      <svg className="h-6 w-6 text-[#716040]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Dashboard",
    to: "/dashboard",
    authOnly: true,
    icon: (
      <svg className="h-5 w-5 text-[#716040]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13h6v8H3zM15 3h6v18h-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
];

// total unread messages across conversations
// computed in the Principal component and injected into SideNav

// MyMap moved to src/components/ui/MapWithSearch.tsx


const formatShortDate = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(parsed);
};


export function Principal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [searchParams, setSearchParams] = useSearchParams(); 
  const [visibleMascotas, setVisibleMascotas] = useState<Mascota[]>([]);
  const [selectedMascota, setSelectedMascota] = useState<Mascota | null>(null);
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const isMounted = useRef(true);
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportedVersion, setReportedVersion] = useState(0);


    // Estado para los filtros
  const [filters, setFilters] = useState({
    estado: 'todos' as 'todos' | 'perdido' | 'encontrado',
    tipo: 'todos' as 'todos' | 'perro' | 'gato' | 'otro',
  });

  // Cargar filtros desde URL al iniciar
  useEffect(() => {
    const estado = searchParams.get('estado') as 'todos' | 'perdido' | 'encontrado' | null;
    const tipo = searchParams.get('tipo') as 'todos' | 'perro' | 'gato' | 'otro' | null;
    setFilters({
      estado: estado || 'todos',
      tipo: tipo || 'todos',
    });
  }, []);

  // Función para aplicar filtros a las mascotas
  const getFilteredMascotas = () => {
    return mascotas.filter((m) => {
      // Filtro por estado
      if (filters.estado !== 'todos') {
        const estadoMascota = (m.estado || '').toLowerCase();
        const filtroEstado = filters.estado.toLowerCase();
        if (!estadoMascota.includes(filtroEstado)) return false;
      }

      // Filtro por tipo
      if (filters.tipo !== 'todos') {
        const tipoMascota = (m.tipo || '').toLowerCase();
        const filtroTipo = filters.tipo.toLowerCase();
        if (tipoMascota !== filtroTipo) return false;
      }

      return true;
    });
  };

  // Función para actualizar un filtro
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Actualizar URL
    setSearchParams({
      ...(newFilters.estado !== 'todos' && { estado: newFilters.estado }),
      ...(newFilters.tipo !== 'todos' && { tipo: newFilters.tipo }),
    });
  };

  // Función para limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({ estado: 'todos', tipo: 'todos' });
    setSearchParams({}); // Limpiar URL
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = filters.estado !== 'todos' || filters.tipo !== 'todos';

  // Obtener mascotas filtradas
  const filteredMascotas = useMemo(() => getFilteredMascotas(), [mascotas, filters.estado, filters.tipo]);


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
  }, [reportedVersion]);

  // compute total unread messages across conversations (limited to first N to avoid heavy load)
  const computeUnreadCount = async () => {
    if (!isMounted.current) return;
    
    const userId = user?.id ?? null;
    if (!userId) return;

    try {
      const resp = await messagingService
        .listConversations(String(userId))
        .catch(() => ({ conversations: [] as any[], totalUnread: 0 }));
      
      const convs: any[] = Array.isArray(resp?.conversations) ? resp.conversations : [];
      
      if (convs.length === 0) {
        if (isMounted.current) setTotalUnread(0);
        return;
      }
      
      const limit = 12;
      const toCheck = convs.slice(0, limit);
      const settled = await Promise.allSettled(
        toCheck.map((c) => messagingService.getConversationMessages(
          String(c.id || c.conversacionId || c.conversationId), 
          String(userId)
        ))
      );
      
      let total = 0;
      for (const s of settled) {
        if (s.status !== 'fulfilled') continue;
        const msgs = Array.isArray((s as any).value) ? (s as any).value : [];
        const unread = msgs.filter((m: any) => {
          const from = String(m.remitenteId || m.senderId || m.from || '').toLowerCase();
          const mine = from === String(userId).toLowerCase();
          if (mine) return false;
          
          const estado = String(m.estado || m.status || '').toLowerCase();
          if (estado) {
            const readStates = ['leido', 'visto', 'read', 'seen', 'readed'];
            const unreadStates = ['enviado', 'sent', 'nuevo', 'new', 'unread'];
            if (readStates.includes(estado)) return false;
            if (unreadStates.includes(estado)) return true;
          }
          
          const readFlag = m.leido ?? m.read ?? m.visto ?? null;
          const readAt = m.readAt ?? m.leidoAt ?? m.leido_fecha ?? null;
          if (readFlag !== null) return !Boolean(readFlag);
          if (readAt) return false;
          if (m.unread !== undefined) return Boolean(m.unread);
          return true;
        }).length;
        total += unread;
      }
      
      if (isMounted.current) setTotalUnread(total);
    } catch (e) {
      console.error('Error computing unread count:', e);
    }
  };

  // Cargar conteo inicial y escuchar eventos WebSocket
  useEffect(() => {
    isMounted.current = true;
    
    // Cargar conteo inicial
    computeUnreadCount();
    
    // 👇 NUEVO: Escuchar eventos de actualización desde WebSocket
    const handleRefreshUnread = () => {
      console.log('🔄 Actualizando badge de mensajes no leídos');
      computeUnreadCount();
    };
    
    // Escuchar evento personalizado (disparado desde App.tsx)
    window.addEventListener('refresh-unread-count', handleRefreshUnread);
    
    // También escuchar directamente las notificaciones WebSocket (alternativa)
    const handleWebSocketNotification = (notification: any) => {
      if (notification.type === 'NEW_MESSAGE' || notification.type === 'MESSAGE_READ') {
        console.log(`📡 Notificación WebSocket: ${notification.type}, actualizando badge`);
        computeUnreadCount();
      }
    };
    
    websocketService.on('NEW_MESSAGE', handleWebSocketNotification);
    websocketService.on('MESSAGE_READ', handleWebSocketNotification);
    
    // ✅ Mantener polling solo como respaldo (cada 60 segundos en lugar de 30)
    const pollingInterval = setInterval(() => {
      console.log('🔄 Polling de respaldo para badge');
      computeUnreadCount();
    }, 60000); // 60 segundos
    
    return () => {
      isMounted.current = false;
      window.removeEventListener('refresh-unread-count', handleRefreshUnread);
      websocketService.off('NEW_MESSAGE', handleWebSocketNotification);
      websocketService.off('MESSAGE_READ', handleWebSocketNotification);
      if (pollingInterval) clearInterval(pollingInterval);
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-[#f5f1ea] text-[#020826]">
      <div className="mx-auto flex flex-col lg:flex-row w-full max-w-full gap-6 px-4 md:px-6 py-6">
        {/* Aside (navegación) */}
        <aside className="hidden lg:flex lg:flex-col lg:min-h-screen w-64 rounded-3xl border border-[#e5e7eb] bg-white/90 p-6 shadow-[0px_25px_50px_rgba(0,0,0,0.1)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#020826] text-white">
              <img src="/assets/huellas.svg" alt="Red de Patitas" className="h-6 w-6" />
            </div>
            <p className="text-xl font-bold">Red de Patitas</p>
          </div>
          <SideNav items={navItems.map((it) => (it.label === 'Mensajes' ? { ...it, count: totalUnread } : it))} />
        </aside>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col rounded-3xl border border-[#e5e7eb] bg-[#f9f4ef]">
          {/* 👇 FILTROS - ubicados arriba del mapa */}
          <div className="px-4 md:px-6 pt-4">
            <MapFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Área de contenido: lista a la izquierda y mapa a la derecha */}
          <div className="flex-1 flex gap-6 px-4 md:px-6 pb-6">
            {/* Lista de reportes (desktop) */}
            <div className="hidden lg:flex w-auto max-w-[360px] flex-col">
              <div className="mb-4 mt-6 flex items-center justify-between px-4">
                <h3 className="text-lg font-bold">
                  Mascotas en la zona
                  {hasActiveFilters && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (filtros aplicados)
                    </span>
                  )}
                </h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Limpiar filtros
                  </Button>
                )}
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
                          time: formatShortDate(pet.fecha_publicacion),
                          location: pet.lugar_desaparicion || "",
                          image: normalizeImage(pet.thumbnail_url),
                          backupImage: normalizeImage(pet.imagen_url),
                        }}
                        onClick={() => setSelectedMascota(pet)}
                      />
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {hasActiveFilters ? "No hay mascotas con estos filtros" : "No hay mascotas en esta zona"}
                  </div>
                )}
              </div>
            </div>

            {/* Mapa - con mascotas filtradas */}
            <div className="relative flex-1 overflow-visible rounded-2xl">
              <MapWithSearch
                mascotas={filteredMascotas}  // 👈 Usamos mascotas filtradas
                onVisibleChange={setVisibleMascotas}
                onSelectMascota={setSelectedMascota}
              />
            </div>
          </div>
        </div>
      </div>
      
      <PrincipalModal
        mascota={selectedMascota}
        onClose={() => setSelectedMascota(null)}
        onOpenReport={() => setReportOpen(true)}
        reportedVersion={reportedVersion}
        onResolved={() => setReportedVersion((v) => v + 1)}
        hideContact={Boolean(!user || (selectedMascota && String(selectedMascota.userid).toLowerCase().trim() === String(user?.id).toLowerCase().trim()))}
        hideReport={Boolean(!user || (selectedMascota && String(selectedMascota.userid).toLowerCase().trim() === String(user?.id).toLowerCase().trim()))}
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        publicationId={selectedMascota?.id ?? ""}
        onReported={() => {
          setReportOpen(false);
          setReportedVersion((v) => v + 1);
        }}
      />
    </div>
  );
}

// render modal for selected mascota
// (placed after Principal to keep component focused)
export function PrincipalModal({
  mascota,
  onClose,
  onOpenReport,
  reportedVersion,
  onResolved,
  hideContact = false,
  hideReport = false,
  hideResolve = false,
}: {
  mascota: Mascota | null;
  onClose: () => void;
  onOpenReport?: () => void;
  reportedVersion?: number;
  onResolved?: () => void;
  hideContact?: boolean;
  hideReport?: boolean;
  hideResolve?: boolean;
}) {
  if (!mascota) return null;

  // determine if current user already reported this publication
  const { user } = useAuth();
  const userId = String(user?.id || "");
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  // compute ownership from mascota data directly
  const ownerIdFromMascota = mascota?.userid ?? mascota?.userid ?? null;
  const isOwner = Boolean(ownerIdFromMascota && String(ownerIdFromMascota).toLowerCase().trim() === String(userId).toLowerCase().trim());
  const reportedKey = `rdp_reported_${userId}`;
  const alreadyReported = (() => {
    try {
      const raw = localStorage.getItem(reportedKey) || "[]";
      const list = JSON.parse(raw);
      return Array.isArray(list) && list.includes(mascota.id);
    } catch {
      return false;
    }
  })();

  // hide success message after a short timeout
  useEffect(() => {
    if (!sentOk) return;
    const id = setTimeout(() => setSentOk(false), 3000);
    return () => clearTimeout(id);
  }, [sentOk]);

  const [resolveOpen, setResolveOpen] = useState(false);
  const [reencontrado, setReencontrado] = useState(true);
  const [resolveMessage, setResolveMessage] = useState("");
  const [resolving, setResolving] = useState(false);

  return (
    <Modal open={!!mascota} onClose={onClose}>
      <div className="space-y-4">
        {sentOk ? (
          <div className="mx-auto w-full max-w-md text-center bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded">mensaje enviado</div>
        ) : null}
        <div className="w-full flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden">
          <img
            src={normalizeImage(mascota.imagen_url)}
            alt={mascota.nombre}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              const backup = normalizeImage(mascota.thumbnail_url);
              if (backup && img.src !== backup) {
                img.src = backup;
                return;
              }
              img.onerror = null;
              img.src = assets.max;
            }}
            className="max-h-[48vh] w-auto object-contain"
            loading="lazy"
          />
        </div>
        <div>
          <h2 className="text-xl font-bold">{mascota.nombre}</h2>
          <div className="text-sm text-muted-foreground">{mascota.tipo} • {formatShortDate(mascota.fecha_publicacion)}</div>
        </div>
        <div className="text-sm text-[#716040]">{mascota.descripcion}</div>
        <div className="text-sm text-[#716040]"><strong>Lugar:</strong> {mascota.lugar_desaparicion}</div>

        {/* Message tab: small absolute panel above modal content */}
        {contactOpen && user ? (
          <div className="absolute left-1/2 top-12 z-50 w-[min(720px,90%)] -translate-x-1/2 bg-white border rounded-lg p-4 shadow-lg">
            {isOwner ? (
              <div className="text-sm text-muted-foreground">Esta es tu publicación</div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <strong className="text-sm">Enviar mensaje</strong>
                  <button className="text-sm text-muted-foreground" onClick={() => { setContactOpen(false); setMessage(''); }}>✕</button>
                </div>
                <Label htmlFor="contactMessage">Mensaje</Label>
                <textarea
                  id="contactMessage"
                  rows={6}
                  placeholder="Escribe tu mensaje aquí"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-gray-200 bg-white rounded-lg p-3 mt-2 mb-2 shadow-sm transition-colors resize-none placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
                <div className="flex mt-3 justify-end gap-2">
                  <Button
                    variant="solid"
                    size="md"
                    onClick={async () => {
                      if (isOwner) {
                        // extra guard: prevent sending to self
                        alert('Esta es tu publicación');
                        return;
                      }
                      if (!message.trim()) return;
                      setSending(true);
                      try {
                        const dto = {
                          reportId: mascota.id,
                          receiverId: String(ownerIdFromMascota || ""),
                          content: message,
                        };
                        await messagingService.sendMessage(dto, userId);
                        setSentOk(true);
                        setMessage('');
                        setContactOpen(false);
                      } catch (err) {
                        console.error('Error enviando mensaje', err);
                        alert('No se pudo enviar el mensaje');
                      } finally {
                        setSending(false);
                      }
                    }}
                    disabled={sending || isOwner}
                  >
                    {sending ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* Buttons row: Contactar, Reportar, Cerrar */}
        <div className="flex gap-2 pt-2">
          {!hideContact && (
            <Button
              variant="solid"
              size="md"
              onClick={() => {
                // ownership determined from mascota.userid; open contact modal if not owner
                if (isOwner) {
                  alert('Esta es tu publicación');
                  setContactOpen(false);
                } else {
                  setContactOpen(true);
                }
              }}
            >
              Contactar
            </Button>
          )}

          {!hideReport && (
            <Button
              variant="solid"
              size="md"
              onClick={() => {
                if (alreadyReported) return;
                if (isOwner) {
                  alert('Esta es tu publicación');
                  return;
                }
                onOpenReport?.();
              }}
              style={{ backgroundColor: alreadyReported ? '#f87171' : '#dc2626', color: '#ffffff', borderColor: alreadyReported ? '#f87171' : '#dc2626' }}
              disabled={alreadyReported}
            >
              {alreadyReported ? 'Reportado' : 'Reportar'}
            </Button>
          )}

          <Button variant="ghost" size="md" onClick={onClose}>Cerrar</Button>

          {!hideResolve && isOwner ? (
            <Button
              variant="solid"
              size="md"
              onClick={() => setResolveOpen(true)}
              className="ml-auto"
            >
              Marcar como resuelta
            </Button>
          ) : null}
        </div>
        {/* Resolve modal for owners */}
        <Modal open={resolveOpen} onClose={() => setResolveOpen(false)}>
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Marcar publicación como resuelta</h3>
            <p className="text-sm text-muted-foreground">¿Se reencontró con su dueño?</p>
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2">
                <input type="radio" name="reencontrado" checked={reencontrado === true} onChange={() => setReencontrado(true)} />
                <span>Sí</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="reencontrado" checked={reencontrado === false} onChange={() => setReencontrado(false)} />
                <span>No</span>
              </label>
            </div>
            <div>
              <Label htmlFor="resolveMessage">Mensaje de agradecimiento (opcional)</Label>
              <textarea
                id="resolveMessage"
                className="w-full rounded border p-2"
                rows={4}
                placeholder="Escribe un mensaje de agradecimiento opcional"
                value={resolveMessage}
                onChange={(e) => setResolveMessage(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setResolveOpen(false)}>Cancelar</Button>
              <Button
                variant="solid"
                size="sm"
                onClick={async () => {
                  setResolving(true);
                  try {
                    await reportsService.resolveReport(String(mascota.id), { reencontrado: Boolean(reencontrado), mensaje: resolveMessage || undefined }, String(userId));
                    alert('Publicación marcada como resuelta');
                    setResolveOpen(false);
                    onResolved?.();
                    onClose();
                  } catch (err) {
                    console.error('Error marcando como resuelta', err);
                    alert('No se pudo marcar como resuelta');
                  } finally {
                    setResolving(false);
                  }
                }}
                disabled={resolving}
              >
                {resolving ? 'Procesando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Modal>
  );
}

export default Principal;