import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import messagingService from '../services/mensajeriaService';
import { fetchMascotas } from '../services/principalService';
import { Avatar, Button, Badge } from '../components/ui';
import { normalizeImage, assets } from '../lib/imageUtils';
const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8080';

export default function MessagesPage() {
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = String(user?.id || '');

  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [texto, setTexto] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    const load = async () => {
      setLoadingConvs(true);
      try {
        const convs = await messagingService.listConversations(userId);
        if (!mounted) return;
        const rawConvs = Array.isArray(convs) ? convs : [];

        // fetch reports list once to resolve image/name fields reliably
        let reportsIndex: Record<string, any> | null = null;
        try {
          const list = await fetchMascotas();
          if (Array.isArray(list)) {
            reportsIndex = list.reduce((acc: Record<string, any>, r: any) => {
              if (r && r.id) acc[String(r.id)] = r;
              return acc;
            }, {});
          }
        } catch (e) {
          reportsIndex = null;
        }

        // normalize conversations to expected display fields, preferring report data from reportsIndex
        const norm = rawConvs.map((c: any) => {
          const id = c.id || c.conversacionId || c.conversationId || c.conversation?.id || c.reportId || c.report?.id || '';

          const reportCandidateId = c.report?.id || c.reportId || null;
          const reportEntry = reportCandidateId && reportsIndex ? reportsIndex[reportCandidateId] : null;

          const mascotaName = reportEntry?.nombre || reportEntry?.pet?.nombre || c?.mascota?.nombre || c.mascotaName || 'Mascota sin nombre';

          const rawThumbCandidates = [
            reportEntry?.thumbnail_url,
            reportEntry?.imagen_url,
            reportEntry?.imagen,
            reportEntry?.image,
            c.mascota?.thumbnail_url,
            c.mascota?.imagen_url,
            c.thumbnail,
            c.report?.pet?.thumbnail_url,
            c.report?.pet?.imagen_url,
          ];
          const rawThumb = rawThumbCandidates.find(Boolean) || '';
          let thumbnail = normalizeImage(rawThumb);
          if (!rawThumb || thumbnail === assets.max) thumbnail = assets.max;

          const otherPerson = (c.participants && Array.isArray(c.participants) && c.participants.find((p: any) => String(p.id) !== String(userId))) || c.publisher || c.publicador || c.owner || c.report?.usuario || null;
          const publisherName = otherPerson?.nombre || otherPerson?.nombreCompleto || otherPerson?.fullName || otherPerson?.displayName || otherPerson?.username || otherPerson?.userName || c.nombrePublicador || c.publisherName || '';
          const publisherId = otherPerson?.id || c.publisherId || c.ownerId || c.publicadorId || '';

          const lastMessage = c.lastMessage || c.ultimoMensaje || c.last || null;

          return { ...c, id: String(id), mascotaName, thumbnail, publisherId, publisherName, lastMessage };
        });
        setConversations(norm);
        // no debug logs
        // compute unread counts by fetching recent messages for each conversation (limited concurrency)
        (async () => {
          try {
            const limit = 12; // avoid too many parallel requests
            const toCheck = norm.slice(0, limit);
            const results = await Promise.allSettled(toCheck.map((cv: any) => messagingService.getConversationMessages(String(cv.id), userId)));
            const updates: Record<string, number> = {};
            results.forEach((r, i) => {
              if (r.status !== 'fulfilled' || !Array.isArray((r as any).value)) return;
              const msgs: any[] = (r as any).value;
              const unread = msgs.filter((m: any) => {
                // message is incoming to current user
                const from = String(m.remitenteId || m.senderId || m.from || '').toLowerCase();
                const mine = from === String(userId).toLowerCase();
                if (mine) return false;

                // prefer explicit status field (spanish `estado` or english `status`)
                const estado = String(m.estado || m.status || '').toLowerCase();
                if (estado) {
                  const readStates = ['leido', 'visto', 'read', 'seen', 'readed'];
                  const unreadStates = ['enviado', 'sent', 'nuevo', 'new', 'unread', 'no-leido', 'no_leido'];
                  if (readStates.includes(estado)) return false;
                  if (unreadStates.includes(estado)) return true;
                  // unknown estado -> fallthrough to other heuristics
                }

                // determine read flag candidates
                const readFlag = m.leido ?? m.read ?? m.visto ?? null;
                const readAt = m.readAt ?? m.leidoAt ?? m.leido_fecha ?? null;
                if (readFlag !== null) return !Boolean(readFlag);
                if (readAt) return false;

                // fallback: if message carries explicit `unread` truthy marker
                if (m.unread !== undefined) return Boolean(m.unread);

                // last-resort: treat as unread if message has no read metadata and is recent
                return true;
              }).length;
              if (unread > 0) updates[String(toCheck[i].id)] = unread;
            });
            if (Object.keys(updates).length) {
              setConversations((prev) => prev.map((p: any) => ({ ...p, unreadCount: updates[String(p.id)] || p.unreadCount || 0 })));
            }
          } catch (e) {
            // ignore errors computing unread counts
          }
        })();
        // Additional enrichment: try to resolve publisherName from report contact endpoint when missing
        (async () => {
          try {
            const toEnrich = norm.filter((c: any) => (!c.publisherName || c.publisherName.length === 0) && (c.report?.id || c.reportId)).slice(0, 12);
            if (toEnrich.length === 0) return;
            const results = await Promise.allSettled(toEnrich.map((c: any) => messagingService.getContactByReport(c.report?.id || c.reportId, userId)));
            results.forEach((r, i) => {
              if (r.status !== 'fulfilled' || !(r as any).value) return;
              const body = (r as any).value.raw ?? (r as any).value;
              if (!body) return;
              // try common owner/contact shapes
              const owner = body.owner || body.publicador || body.user || body.usuario || body.contact || null;
              let name = null;
              if (owner) name = owner.nombre || owner.fullName || owner.displayName || owner.username || owner.userName || owner.nombreCompleto || null;
              // some endpoints return top-level fields like ownerName, contactName
              if (!name) name = body.ownerName || body.contactName || body.nombrePublicador || null;
              if (name) {
                const convId = String(toEnrich[i].id);
                setConversations((prev) => prev.map((p: any) => (String(p.id) === convId ? { ...p, publisherName: name } : p)));
                if (selectedConv?.id === convId) setSelectedConv((s: any) => (s ? { ...s, publisherName: name } : s));
              }
            });
          } catch (e) {
            // ignore enrichment errors
          }
        })();
        
        // Enrichment: try to fetch missing mascotaName / publisherName from API
        (async () => {
          for (const conv of norm) {
            // prepare candidate ids for pet
            const petCandidates = [
              conv.mascota?.id,
              conv.report?.pet?.id,
              conv.report?.mascota?.id,
              conv.report?.pet?.id,
              conv.reportId,
              conv.report?.id,
              conv.petId,
              conv.mascotaId,
            ].filter(Boolean);

            if ((!conv.mascotaName || conv.mascotaName === 'Mascota sin nombre') && petCandidates.length) {
              // first try to resolve from reportsIndex (GET /api/reports returns list with imagen/thumbnail)
              const reportCandidateId = conv.report?.id || conv.reportId || null;
              if (reportCandidateId && reportsIndex && reportsIndex[reportCandidateId]) {
                const rep = reportsIndex[reportCandidateId];
                const petNameFromRep = rep?.nombre || rep?.pet?.nombre || rep?.mascota?.nombre || null;
                const petImgFromRep = rep?.thumbnail_url || rep?.imagen_url || rep?.imagen || rep?.image || rep?.pet?.thumbnail_url || rep?.pet?.imagen_url || null;
                if (petNameFromRep) {
                  setConversations((prev) => prev.map((p: any) => (p.id === conv.id ? { ...p, mascotaName: petNameFromRep } : p)));
                  if (selectedConv?.id === conv.id) setSelectedConv((s: any) => (s ? { ...s, mascotaName: petNameFromRep } : s));
                }
                if (petImgFromRep) {
                  const thumb = normalizeImage(petImgFromRep);
                  setConversations((prev) => prev.map((p: any) => (p.id === conv.id ? { ...p, thumbnail: thumb } : p)));
                  if (selectedConv?.id === conv.id) setSelectedConv((s: any) => (s ? { ...s, thumbnail: thumb } : s));
                }
                // if found in reportsIndex, skip per-id fetches
                if (petNameFromRep || petImgFromRep) continue;
              }

              for (const pid of petCandidates) {
                try {
                  const r = await fetch(`${API_BASE}/api/pets/${pid}`);
                  if (!r.ok) continue;
                  const body = await r.json().catch(() => null);
                  const petName = body?.nombre || body?.mascota?.nombre || body?.pet?.nombre || null;
                  const petImg = body?.imagen_url || body?.thumbnail_url || body?.image || body?.foto || body?.fotoUrl || body?.imageUrl || body?.imagen || (body?.mascota && (body.mascota.imagen_url || body.mascota.thumbnail_url || body.mascota.image)) || null;

                  let updated = false;
                  if (petName) {
                    setConversations((prev) => prev.map((p: any) => (p.id === conv.id ? { ...p, mascotaName: petName } : p)));
                    if (selectedConv?.id === conv.id) setSelectedConv((s: any) => (s ? { ...s, mascotaName: petName } : s));
                    updated = true;
                  }
                  if (petImg) {
                    const thumb = normalizeImage(petImg);
                    setConversations((prev) => prev.map((p: any) => (p.id === conv.id ? { ...p, thumbnail: thumb } : p)));
                    if (selectedConv?.id === conv.id) setSelectedConv((s: any) => (s ? { ...s, thumbnail: thumb } : s));
                    updated = true;
                  }
                  if (updated) break;
                } catch (e) {
                  // ignore and try next
                }
              }
            }

            // publisher/user enrichment: do NOT call /api/users/{id} (no such endpoint)
            if ((!conv.publisherName || conv.publisherName.length === 0)) {
              // try to obtain from participants or owner fields
              const other = (conv.participants && Array.isArray(conv.participants) && conv.participants.find((p: any) => String(p.id) !== String(userId))) || conv.owner || conv.publicador || conv.publisher || null;
              const fromOther = other ? (other.nombre || other.username || other.userName || null) : null;
              if (fromOther) {
                setConversations((prev) => prev.map((p: any) => (p.id === conv.id ? { ...p, publisherName: fromOther } : p)));
                if (selectedConv?.id === conv.id) setSelectedConv((s: any) => (s ? { ...s, publisherName: fromOther } : s));
              } else {
                // if publisherId matches current user, use auth name
                const pid = conv.publisherId || conv.ownerId || conv.publicadorId || (other && other.id) || null;
                if (pid && String(pid) === String(user?.id)) {
                  const selfName = user?.username || (user as any)?.nombre || null;
                  if (selfName) {
                    setConversations((prev) => prev.map((p: any) => (p.id === conv.id ? { ...p, publisherName: selfName } : p)));
                    if (selectedConv?.id === conv.id) setSelectedConv((s: any) => (s ? { ...s, publisherName: selfName } : s));
                  }
                } else {
                  // final fallback: short id
                  const fallback = pid ? `Usuario ${String(pid).slice(0, 8)}` : '';
                  if (fallback) {
                    setConversations((prev) => prev.map((p: any) => (p.id === conv.id ? { ...p, publisherName: fallback } : p)));
                    if (selectedConv?.id === conv.id) setSelectedConv((s: any) => (s ? { ...s, publisherName: fallback } : s));
                  }
                }
              }
            }
          }
        })();
        // if navigated with a selectedConversationId, auto-select when convs loaded
        const selId = (location.state as any)?.selectedConversationId;
        if (selId) {
          const found = norm.find((c: any) => String(c.id) === String(selId));
          if (found) setSelectedConv(found);
        }
      } catch (err) {
        console.error('Error cargando conversaciones', err);
      } finally {
        setLoadingConvs(false);
      }
    };
    load();

    const iv = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(iv); };
  }, [userId]);

  useEffect(() => {
    if (!selectedConv) return;
    let mounted = true;
    const loadMsgs = async () => {
      setLoadingMsgs(true);
      try {
      const msgs = await messagingService.getConversationMessages(selectedConv.id, userId);
      if (!mounted) return;
      setMessages(Array.isArray(msgs) ? msgs : []);
      // update UI: clear unread count for this conversation
      setConversations((prev) => prev.map((p: any) => (p.id === selectedConv.id ? { ...p, unreadCount: 0 } : p)));
      } catch (err) {
        console.error('Error cargando mensajes', err);
      } finally {
        setLoadingMsgs(false);
        // scroll
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      // mark as read on server (do not await to avoid blocking UI)
      (async () => { try { await messagingService.markConversationAsRead(selectedConv.id, userId); } catch (e) { /* ignore */ } })();
    };
    loadMsgs();

    const iv = setInterval(loadMsgs, 30000);
    return () => { mounted = false; clearInterval(iv); };
  }, [selectedConv, userId]);

  const selectConv = (conv: any) => {
    setSelectedConv(conv);
  };

  const send = async () => {
    if (!texto.trim() || !userId) return;
    try {
      const dto = { reportId: null, conversacionId: selectedConv?.id ?? null, contenido: texto };
      await messagingService.sendMessage(dto, userId);
      setTexto('');
      // reload messages
      const msgs = await messagingService.getConversationMessages(selectedConv.id, userId);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      console.error('Error enviando mensaje', err);
      alert('No se pudo enviar el mensaje');
    }
  };

  const getDisplayNameForConv = (conv: any) => {
    if (!conv) return 'Usuario Desconocido';
    if (conv.publisherName && conv.publisherName.length > 0) return conv.publisherName;

    // 1) participants: the other person
    if (conv.participants && Array.isArray(conv.participants)) {
      const other = conv.participants.find((p: any) => String(p.id) !== String(userId));
      if (other) return other.nombre || other.nombreCompleto || other.fullName || other.displayName || other.username || other.userName || 'Usuario Desconocido';
    }

    // 2) common top-level fields or nested report.user
    const otherPerson = conv.publisher || conv.publicador || conv.owner || conv.usuario || conv.report?.usuario || conv.report?.user || null;
    if (otherPerson) return otherPerson.nombre || otherPerson.nombreCompleto || otherPerson.fullName || otherPerson.displayName || otherPerson.username || otherPerson.userName || 'Usuario Desconocido';

    // 3) if publisherId matches authenticated user, use auth name
    const pid = conv.publisherId || conv.ownerId || conv.publicadorId || (conv.participants && Array.isArray(conv.participants) && conv.participants[0]?.id) || null;
    if (pid && String(pid) === String(user?.id)) return user?.username || (user as any)?.nombre || 'Yo';

    // We cannot obtain the other user's real name from the auth service here
    // because the frontend only has access to the authenticated user's identity.
    // Return a neutral fallback to avoid showing raw ids.
    return 'Nombre no disponible';
  };

  return (
    <div className="min-h-screen bg-[#f5f1ea] p-4 sm:p-6 relative">
      <div className="mx-auto max-w-6xl mb-6 px-4">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#020826] text-white">
            <img src="/assets/huellas.svg" alt="logo" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-semibold">Red de Patitas</p>
            <div className="text-sm text-muted-foreground font-bold">Bandeja</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Conversaciones</h3>
        </div>
        <div className="flex flex-col md:flex-row">
          <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r pr-0 md:pr-4 pb-4 md:pb-0">
            {loadingConvs ? (
              <div>Cargando...</div>
            ) : (
              <div className="space-y-2">
                {conversations.length === 0 ? <div className="text-sm text-muted-foreground">No hay conversaciones</div> : null}
                {conversations.map((c) => {
                  const title = c.mascotaName || c.mascota?.nombre || c.id;
                  const preview = (c.lastMessage && (c.lastMessage.contenido || c.lastMessage.mensaje || c.lastMessage.message)) || '';
                  const publisher = getDisplayNameForConv(c);
                  return (
                    <div key={c.id} className={`p-2 rounded cursor-pointer ${selectedConv?.id === c.id ? 'bg-[#f3f4f6]' : 'hover:bg-[#f9fafb]'}`} onClick={() => selectConv(c)}>
                      <div className="flex items-center gap-3">
                        <Avatar src={c.thumbnail || ''} alt={title} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm">{title}</div>
                            {(c.unreadCount || c.unreadMessages || c.unreadMessagesCount || c.unread) > 0 ? (
                              <Badge tone="warning">{c.unreadCount || c.unreadMessages || c.unreadMessagesCount || c.unread}</Badge>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{publisher || ''} • {preview}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>

          <main className="flex-1 pt-4 md:pt-0 md:pl-4 flex flex-col">
            {selectedConv ? (
              <>
                <div className="border-b pb-3 mb-3">
                  <h4 className="font-bold">{selectedConv.mascotaName || selectedConv.title || selectedConv.mascota?.nombre || selectedConv.id}</h4>
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const name = getDisplayNameForConv(selectedConv);
                      return name ? `Publicador: ${name}` : 'Cargando nombre...';
                    })()}
                  </div>
                </div>
                <div className="flex-1 overflow-auto px-2">
                  {loadingMsgs ? <div>Cargando mensajes...</div> : (
                    <div className="space-y-3">
                      {messages.map((m: any) => {
                        const mine = String(m.remitenteId || m.senderId || m.from) === String(userId);
                        return (
                          <div key={m.id || Math.random()} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`${mine ? 'bg-[#dbeafe] text-[#1e3a8a] shadow-md rounded-2xl' : 'bg-[#f3f4f6] text-[#111827] shadow-sm rounded-lg'} max-w-[70%] p-3`}> 
                              <div className="text-sm">{m.contenido || m.message || m.text}</div>
                              <div className="text-[11px] text-muted-foreground mt-1">{m.createdAt || m.fechaCreacion || m.fecha || ''}</div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="mt-3 border-t pt-3">
                  <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm">
                    <textarea id="mensaje-conversacion" name="mensaje" value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} className="flex-1 rounded-xl border border-gray-100 p-3 outline-none resize-none" placeholder="Escribe un mensaje..." />
                    <Button variant="solid" size="md" onClick={send} className="shadow-md">Enviar</Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">Selecciona una conversación</div>
            )}
          </main>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/')}
        aria-label="Cerrar Bandeja y volver"
        className="absolute right-4 top-4 flex items-center gap-2 rounded-md bg-[#020826] px-3 py-1.5 text-sm text-white hover:bg-[#1a2a4a] transition-colors z-20"
      >
        Cerrar
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
