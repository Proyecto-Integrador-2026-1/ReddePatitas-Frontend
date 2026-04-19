
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// map primitives are used inside MapWithSearch
import { Star, Navigation, Clock, ExternalLink } from "lucide-react";
import { Avatar, Chip, PetCard, Pet, SideNav, Button, Badge, Card } from "../components/ui";
import mensajesService from "../services/mensajesService";
import MapWithSearch from "../components/ui/MapWithSearch";
import { assets, normalizeImage } from "@/lib/imageUtils";
import Modal from "../components/ui/Modal";
import { createReporte } from "../services/reporteService";
import type { Mascota } from "../types/mascota";
import { fetchMascotas } from "../services/principalService";

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
    icon: (
      <svg className="h-5 w-5 text-[#8c7851]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Bandeja",
    to: "/bandeja",
    icon: (
      <svg className="h-5 w-5 text-[#8c7851]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 8h18M3 16h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
  {
    label: "Notificaciones",
    to: "/notificaciones",
    icon: (
      <svg className="h-5 w-5 text-[#716040] overflow-visible" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 17H9a3 3 0 0 1-3-3V10a6 6 0 1 1 12 0v4a3 3 0 0 1-3 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Mi Perfil",
    to: "/perfil",
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
];

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
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [visibleMascotas, setVisibleMascotas] = useState<Mascota[]>([]);
  const [selectedMascota, setSelectedMascota] = useState<Mascota | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const prevUnreadRef = React.useRef(0);

  const getLoggedPhone = (): string | null => {
    try {
      const raw = localStorage.getItem("rdp_last_login");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return String(obj.phone ?? obj.phone ?? "").replace(/\D/g, "").trim() || null;
    } catch {
      return null;
    }
  };

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

  // Poll for new messages every 30s and update unread badge
  useEffect(() => {
    let mounted = true;
    let timer: any = null;

    const fetchUnread = async () => {
      const phone = getLoggedPhone();
      if (!phone) return;
      try {
        const convs = await mensajesService.getConversationsForPhone(phone);
        const total = convs.reduce((s: number, c: any) => s + (c.unread || 0), 0);
        if (!mounted) return;
        // show a brief alert if new unread messages arrived
        if (total > prevUnreadRef.current) {
          setNewMessageAlert(true);
          window.setTimeout(() => setNewMessageAlert(false), 4000);
        }
        prevUnreadRef.current = total;
        setUnreadCount(total);
      } catch (e) {
        // ignore polling errors
      }
    };

    // initial
    fetchUnread();
    timer = setInterval(fetchUnread, 30000);
    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f1ea] text-[#020826]">
      {newMessageAlert && (
        <div className="fixed right-6 top-6 z-50 bg-emerald-600 text-white px-4 py-2 rounded shadow-md">
          Tienes {unreadCount} mensaje{unreadCount === 1 ? '' : 's'} nuevos
        </div>
      )}
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
          {/* Inject unread count into nav items */}
          {(() => {
            const itemsWithCounts = navItems.map((it) => (it.label === "Notificaciones" ? { ...it, count: unreadCount } : it));
            return <SideNav items={itemsWithCounts} />;
          })()}
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
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reporting, setReporting] = React.useState(false);
  const [reported, setReported] = React.useState(() => {
    try {
      const raw = localStorage.getItem("reported_mascotas");
      const arr: string[] = raw ? JSON.parse(raw) : [];
      return arr.includes(mascota.id);
    } catch (e) {
      return false;
    }
  });

  const openReport = () => setReportOpen(true);
  const closeReport = () => setReportOpen(false);

  const markReportedLocal = (id: string) => {
    try {
      const raw = localStorage.getItem("reported_mascotas");
      const arr: string[] = raw ? JSON.parse(raw) : [];
      if (!arr.includes(id)) arr.push(id);
      localStorage.setItem("reported_mascotas", JSON.stringify(arr));
      setReported(true);
    } catch (e) {
      // ignore
    }
  };

  const navigate = useNavigate();
  const [showContact, setShowContact] = React.useState(false);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [messageModalOpen, setMessageModalOpen] = React.useState(false);
  const [messageTarget, setMessageTarget] = React.useState<{phone?:string; name?:string; mascotaId?:string}|null>(null);

  React.useEffect(() => {
    setShowContact(false);
  }, [mascota]);

  const getLoggedPhone = (): string | null => {
    try {
      const raw = localStorage.getItem("rdp_last_login");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return String(obj.phone ?? obj.phone ?? "").replace(/\D/g, "").trim() || null;
    } catch {
      return null;
    }
  };

  const handleContactClick = () => {
    const phone = getLoggedPhone();
    if (!phone) {
      // require login to see contact -> show auth modal instead of redirect
      setAuthModalOpen(true);
      return;
    }
    setShowContact(true);
  };

  const openMessageModal = (toPhone?: string, toName?: string, mascotaId?: string) => {
    setMessageTarget({ phone: toPhone, name: toName, mascotaId });
    setMessageModalOpen(true);
  };

  const closeMessageModal = () => {
    setMessageModalOpen(false);
    setMessageTarget(null);
  };

  return (
    <>
      <Modal open={!!mascota} onClose={onClose}>
      <div className="space-y-4">
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
        <div className="flex gap-2 pt-2">
          <Button variant="solid" size="md" onClick={handleContactClick}>Contactar</Button>
          <Button variant="ghost" size="md" onClick={onClose}>Cerrar</Button>
          <Button
            variant="solid"
            size="md"
            onClick={openReport}
            disabled={reported}
            className={reported ? "opacity-60 cursor-not-allowed bg-red-600" : "bg-red-600 hover:bg-red-700 border-transparent shadow-none"}
          >
            {reported ? "Reportado" : "Reportar"}
          </Button>
        </div>
        {showContact && (
          <div className="mt-2 rounded-md border p-3 bg-white">
            {/* Try to detect contact fields on mascota object */}
            {(() => {
              const anyM: any = mascota as any;
              const phoneKeys = ["telefono", "phone", "contact_phone", "owner_phone", "contactPhone", "phoneNumber"];
              const nameKeys = ["publisher", "propietario", "owner", "contact_name", "contactName", "nombre_publicador"];
              let phone: string | undefined;
              let name: string | undefined;
              for (const k of phoneKeys) {
                if (anyM[k]) {
                  phone = String(anyM[k]);
                  break;
                }
              }
              for (const k of nameKeys) {
                if (anyM[k]) {
                  name = String(anyM[k]);
                  break;
                }
              }

              const logged = getLoggedPhone();
              const normalizedPhone = phone ? phone.replace(/\D/g, "") : null;

              if (normalizedPhone && logged && normalizedPhone === logged) {
                return <p className="text-sm text-[#716040] font-medium">Esta es tu publicación</p>;
              }

              if (!phone && !name) {
                return <p className="text-sm text-[#716040]">Contacto no disponible.</p>;
              }

              return (
                <div className="space-y-2">
                  {name && <div className="text-sm"><strong>Nombre:</strong> {name}</div>}
                  {phone && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm"><strong>Teléfono:</strong> {phone}</div>
                      <div className="ml-2 flex gap-2">
                        <a href={`tel:${phone.replace(/\D/g, "")}`}>
                          <Button variant="solid" size="sm">Llamar</Button>
                        </a>
                        <Button variant="outline" size="sm" onClick={() => openMessageModal(phone, name, mascota.id)}>Enviar mensaje</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
      </Modal>

      {/* Modal shown when user attempts to contact but is not authenticated */}
      <Modal open={authModalOpen} onClose={() => setAuthModalOpen(false)}>
        <div className="space-y-4 max-w-md">
          <h3 className="text-lg font-bold">No autenticado</h3>
          <p className="text-sm text-[#716040]">Debes iniciar sesión para ver los datos de contacto de la publicación.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="md" onClick={() => { setAuthModalOpen(false); onClose(); }}>
              Volver
            </Button>
            <Button variant="solid" size="md" onClick={() => { setAuthModalOpen(false); navigate('/login'); }}>
              Ir a iniciar sesión
            </Button>
          </div>
        </div>
      </Modal>
      <ReportModal mascota={mascota} open={reportOpen} onClose={closeReport} onSent={() => markReportedLocal(mascota.id)} />

      <SendMessageModal
        open={messageModalOpen}
        toPhone={messageTarget?.phone}
        toName={messageTarget?.name}
        mascotaId={messageTarget?.mascotaId}
        onClose={closeMessageModal}
      />
    </>
  );
}

// Report modal component (simple, in-file)
export function ReportModal({
  mascota,
  open,
  onClose,
  onSent,
}: {
  mascota: Mascota | null;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [reason, setReason] = React.useState<string>("");
  const [comment, setComment] = React.useState<string>("");
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [otherReason, setOtherReason] = React.useState<string>("");
  const [reasonError, setReasonError] = React.useState<string>("");
  const [otherReasonError, setOtherReasonError] = React.useState<string>("");
  const [submissionError, setSubmissionError] = React.useState<string>("");

  if (!mascota) return null;

  const submit = async () => {
    if (loading) return;
    // clear previous errors
    setReasonError("");
    setOtherReasonError("");

    // validate
    if (!reason) {
      setReasonError("El motivo es obligatorio.");
      return;
    }
    if (reason === "otro") {
      if (!otherReason || otherReason.trim().length < 5) {
        setOtherReasonError("El motivo 'Otro' requiere al menos 5 caracteres.");
        return;
      }
    }

    setLoading(true);
    try {
      const finalReason = reason === "otro" ? otherReason.trim() : reason;
      await createReporte({ mascotaId: mascota.id, reason: finalReason, comment }, file ?? undefined);
      try {
        const raw = localStorage.getItem("reported_mascotas");
        const arr: string[] = raw ? JSON.parse(raw) : [];
        if (!arr.includes(mascota.id)) arr.push(mascota.id);
        localStorage.setItem("reported_mascotas", JSON.stringify(arr));
      } catch (e) {
        // ignore
      }
      onSent();
      onClose();
    } catch (err: any) {
      console.error("Error sending report:", err);
      // Fallback: save report locally so dev can test without backend
      try {
        const reportsRaw = localStorage.getItem("rdp_reports") || "[]";
        const reports = Array.isArray(JSON.parse(reportsRaw)) ? JSON.parse(reportsRaw) : [];
        const saved = {
          id: `local-${Date.now()}`,
          mascotaId: mascota.id,
          reason: reason === "otro" ? otherReason.trim() : reason,
          comment,
          createdAt: new Date().toISOString(),
        };
        reports.push(saved);
        localStorage.setItem("rdp_reports", JSON.stringify(reports));
        // also mark as reported locally
        try {
          const raw = localStorage.getItem("reported_mascotas");
          const arr: string[] = raw ? JSON.parse(raw) : [];
          if (!arr.includes(mascota.id)) arr.push(mascota.id);
          localStorage.setItem("reported_mascotas", JSON.stringify(arr));
        } catch (e) {}
        setSubmissionError("Servidor no disponible: el reporte se guardó localmente para pruebas.");
        onSent();
        onClose();
      } catch (e2) {
        const msg = err?.message ? String(err.message) : "No se pudo enviar el reporte. Intenta nuevamente.";
        setSubmissionError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Reportar publicación</h3>
        <div className="space-y-2">
          <label className="block text-sm">Motivo</label>
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2"><input type="radio" name="reason" value="spam" checked={reason === "spam"} onChange={() => { setReason("spam"); setReasonError(""); }} /> Spam</label>
            <label className="inline-flex items-center gap-2"><input type="radio" name="reason" value="datos_incorrectos" checked={reason === "datos_incorrectos"} onChange={() => { setReason("datos_incorrectos"); setReasonError(""); }} /> Datos incorrectos</label>
            <label className="inline-flex items-center gap-2"><input type="radio" name="reason" value="maltrato" checked={reason === "maltrato"} onChange={() => { setReason("maltrato"); setReasonError(""); }} /> Maltrato</label>
            <label className="inline-flex items-center gap-2"><input type="radio" name="reason" value="otro" checked={reason === "otro"} onChange={() => { setReason("otro"); setReasonError(""); }} /> Otro</label>
          </div>
        </div>
        {reasonError && <p className="text-red-600 text-sm mt-1">{reasonError}</p>}
        {reason === "otro" && (
          <div>
            <label className="block text-sm">Especificar motivo</label>
            <input value={otherReason} onChange={(e) => { setOtherReason(e.target.value); setOtherReasonError(""); }} className="w-full rounded-md border p-2" placeholder="Describe el motivo (mínimo 5 caracteres)" />
            {otherReasonError && <p className="text-red-600 text-sm mt-1">{otherReasonError}</p>}
          </div>
        )}
        <div>
          <label className="block text-sm">Comentario (opcional)</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full rounded-md border p-2" />
        </div>
        <div>
          <label className="block text-sm">Adjuntar imagen (opcional)</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="solid" size="md" onClick={submit} disabled={loading}>{loading ? "Enviando..." : "Enviar reporte"}</Button>
          <Button variant="ghost" size="md" onClick={onClose}>Cancelar</Button>
        </div>
        {submissionError && <p className="text-red-600 text-sm mt-2">{submissionError}</p>}
      </div>
    </Modal>
  );
}

// SendMessageModal - local-storage backed for dev
function SendMessageModal({ open, onClose, toPhone, toName, mascotaId }: { open: boolean; onClose: () => void; toPhone?: string; toName?: string; mascotaId?: string; }) {
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sentOk, setSentOk] = React.useState(false);

  React.useEffect(()=>{ if(!open){ setBody(""); setError(null); setSentOk(false); setSending(false);} },[open]);

  const getLoggedPhoneLocal = (): string | null => {
    try {
      const raw = localStorage.getItem("rdp_last_login");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return String(obj.phone ?? "").replace(/\D/g, "") || null;
    } catch { return null; }
  };

  const submit = async () => {
    setError(null);
    const from = getLoggedPhoneLocal();
    if (!from) {
      setError("Debes iniciar sesión para enviar mensajes.");
      return;
    }
    if (!toPhone) {
      setError("Teléfono de destino no disponible.");
      return;
    }
    if (!body || body.trim().length < 1) {
      setError("El mensaje no puede estar vacío.");
      return;
    }
    setSending(true);
    try {
      await mensajesService.sendMessage({ mascotaId: mascotaId ?? null, fromPhone: from, toPhone, body: body.trim() });
      setSentOk(true);
      // close modal shortly after success
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally { setSending(false); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4 max-w-md">
        <h3 className="text-lg font-bold">Enviar mensaje{toName ? ` a ${toName}` : ''}</h3>
        <p className="text-sm text-[#716040]">El mensaje se enviará a través de la plataforma (solo en localStorage para pruebas).</p>
        <textarea value={body} onChange={(e)=> setBody(e.target.value)} className="w-full rounded-md border p-2" rows={5} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {sentOk && <p className="text-green-600 text-sm">Mensaje enviado (guardado en localStorage).</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="md" onClick={onClose}>Cancelar</Button>
          <Button variant="solid" size="md" onClick={submit} disabled={sending || sentOk}>{sending ? 'Enviando...' : (sentOk ? 'Enviado' : 'Enviar')}</Button>
        </div>
      </div>
    </Modal>
  );
}

export default Principal;