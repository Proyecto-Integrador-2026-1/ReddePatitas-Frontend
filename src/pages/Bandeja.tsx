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
        const resp = await messagingService.listConversations(userId);
        if (!mounted) return;

        const rawConvs = Array.isArray(resp?.conversations) ? resp.conversations : [];

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

        const norm = rawConvs.map((c: any) => {
          const id =
            c.id ||
            c.conversacionId ||
            c.conversationId ||
            c.conversation?.id ||
            c.reportId ||
            c.report?.id ||
            '';

          const reportCandidateId = c.report?.id || c.reportId || null;
          const reportEntry = reportCandidateId && reportsIndex ? reportsIndex[reportCandidateId] : null;

          const mascotaName =
            reportEntry?.nombre ||
            reportEntry?.pet?.nombre ||
            c?.mascota?.nombre ||
            c.mascotaName ||
            'Mascota sin nombre';

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

          const otherPerson =
            (c.participants &&
              Array.isArray(c.participants) &&
              c.participants.find((p: any) => String(p.id) !== String(userId))) ||
            c.publisher ||
            c.publicador ||
            c.owner ||
            c.report?.usuario ||
            null;

          const publisherName =
            otherPerson?.nombre ||
            otherPerson?.nombreCompleto ||
            otherPerson?.fullName ||
            otherPerson?.displayName ||
            otherPerson?.username ||
            otherPerson?.userName ||
            c.nombrePublicador ||
            c.publisherName ||
            '';

          const publisherId =
            otherPerson?.id || c.publisherId || c.ownerId || c.publicadorId || '';

          const lastMessage = c.lastMessage || c.ultimoMensaje || c.last || null;

          return {
            ...c,
            id: String(id),
            mascotaName,
            thumbnail,
            publisherId,
            publisherName,
            lastMessage,
          };
        });

        setConversations(norm);

        (async () => {
          try {
            const limit = 12;
            const toCheck = norm.slice(0, limit);
            const results = await Promise.allSettled(
              toCheck.map((cv: any) =>
                messagingService.getConversationMessages(String(cv.id), userId)
              )
            );
            const updates: Record<string, number> = {};
            results.forEach((r, i) => {
              if (r.status !== 'fulfilled' || !Array.isArray((r as any).value)) return;
              const msgs: any[] = (r as any).value;
              const unread = msgs.filter((m: any) => {
                const from = String(m.remitenteId || m.senderId || m.from || '').toLowerCase();
                const mine = from === String(userId).toLowerCase();
                if (mine) return false;

                const estado = String(m.estado || m.status || '').toLowerCase();
                if (estado) {
                  const readStates = ['leido', 'visto', 'read', 'seen', 'readed'];
                  const unreadStates = ['enviado', 'sent', 'nuevo', 'new', 'unread', 'no-leido', 'no_leido'];
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
              if (unread > 0) updates[String(toCheck[i].id)] = unread;
            });
            if (Object.keys(updates).length) {
              setConversations((prev) =>
                prev.map((p: any) => ({
                  ...p,
                  unreadCount: updates[String(p.id)] || p.unreadCount || 0,
                }))
              );
            }
          } catch (e) {}
        })();


        (async () => {
          for (const conv of norm) {
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
                } catch (e) {}
              }
            }

            if ((!conv.publisherName || conv.publisherName.length === 0)) {
              const other = (conv.participants && Array.isArray(conv.participants) && conv.participants.find((p: any) => String(p.id) !== String(userId))) || conv.owner || conv.publicador || conv.publisher || null;
              const fromOther = other ? (other.nombre || other.username || other.userName || null) : null;
              if (fromOther) {
                setConversations((prev) => prev.map((p: any) => (p.id === conv.id ? { ...p, publisherName: fromOther } : p)));
                if (selectedConv?.id === conv.id) setSelectedConv((s: any) => (s ? { ...s, publisherName: fromOther } : s));
              } else {
                const pid = conv.publisherId || conv.ownerId || conv.publicadorId || (other && other.id) || null;
                if (pid && String(pid) === String(user?.id)) {
                  const selfName = user?.username || (user as any)?.nombre || null;
                  if (selfName) {
                    setConversations((prev) => prev.map((p: any) => (p.id === conv.id ? { ...p, publisherName: selfName } : p)));
                    if (selectedConv?.id === conv.id) setSelectedConv((s: any) => (s ? { ...s, publisherName: selfName } : s));
                  }
                } else {
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
        setConversations((prev) => prev.map((p: any) => (p.id === selectedConv.id ? { ...p, unreadCount: 0 } : p)));
      } catch (err) {
        console.error('Error cargando mensajes', err);
      } finally {
        setLoadingMsgs(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      (async () => { try { await messagingService.markConversationAsRead(selectedConv.id, userId); } catch (e) {} })();
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

    if (conv.participants && Array.isArray(conv.participants)) {
      const other = conv.participants.find((p: any) => String(p.id) !== String(userId));
      if (other) return other.nombre || other.nombreCompleto || other.fullName || other.displayName || other.username || other.userName || 'Usuario Desconocido';
    }

    const otherPerson = conv.publisher || conv.publicador || conv.owner || conv.usuario || conv.report?.usuario || conv.report?.user || null;
    if (otherPerson) return otherPerson.nombre || otherPerson.nombreCompleto || otherPerson.fullName || otherPerson.displayName || otherPerson.username || otherPerson.userName || 'Usuario Desconocido';

    const pid = conv.publisherId || conv.ownerId || conv.publicadorId || (conv.participants && Array.isArray(conv.participants) && conv.participants[0]?.id) || null;
    if (pid && String(pid) === String(user?.id)) return user?.username || (user as any)?.nombre || 'Yo';

    return 'Nombre no disponible';
  };

  return (
    <div className="min-h-screen bg-[#f5f1ea] p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#020826]">Mensajes</h1>
            <p className="text-sm text-[#716040]">Conversaciones activas</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Volver
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3 shadow-[0px_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between px-2 py-2">
              <h2 className="text-sm font-semibold text-[#020826]">Conversaciones</h2>
              {loadingConvs && <span className="text-xs text-[#716040]">Cargando...</span>}
            </div>

            <div className="max-h-[70vh] space-y-2 overflow-y-auto px-1">
              {conversations.length === 0 && !loadingConvs ? (
                <div className="rounded-xl bg-[#f9f4ef] p-4 text-sm text-[#716040]">
                  Aun no tienes conversaciones.
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = selectedConv?.id === conv.id;
                  const name = getDisplayNameForConv(conv);
                  const badge = typeof conv.unreadCount === 'number' ? conv.unreadCount : 0;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                        isActive ? 'bg-[#f9f4ef] shadow-[0px_4px_8px_rgba(0,0,0,0.08)]' : 'hover:bg-[#f6f1e7]'
                      }`}
                      onClick={() => selectConv(conv)}
                    >
                      <Avatar src={conv.thumbnail} fallback={name?.[0] || 'U'} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm font-semibold text-[#020826]">{name}</span>
                          {badge > 0 && (
                            <Badge className="bg-[#8c7851] text-white">{badge}</Badge>
                          )}
                        </div>
                        <div className="truncate text-xs text-[#716040]">
                          {conv.mascotaName || 'Mascota sin nombre'}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0px_10px_30px_rgba(0,0,0,0.06)]">
            {!selectedConv ? (
              <div className="flex h-[60vh] items-center justify-center text-sm text-[#716040]">
                Selecciona una conversacion para ver los mensajes.
              </div>
            ) : (
              <div className="flex h-[60vh] flex-col">
                <div className="border-b border-[#e5e7eb] pb-3">
                  <div className="text-sm font-semibold text-[#020826]">{getDisplayNameForConv(selectedConv)}</div>
                  <div className="text-xs text-[#716040]">{selectedConv.mascotaName || 'Mascota sin nombre'}</div>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto py-4">
                  {loadingMsgs ? (
                    <div className="text-sm text-[#716040]">Cargando mensajes...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-[#716040]">No hay mensajes aun.</div>
                  ) : (
                    messages.map((msg: any, idx: number) => {
                      const from = String(msg.remitenteId || msg.senderId || msg.from || '');
                      const isMine = from && String(userId) === String(from);
                      return (
                        <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                              isMine
                                ? 'bg-[#020826] text-white'
                                : 'bg-[#f9f4ef] text-[#020826]'
                            }`}
                          >
                            {msg.contenido || msg.texto || msg.body || ''}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    className="h-10 flex-1 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#8c7851]"
                    placeholder="Escribe un mensaje..."
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') send();
                    }}
                  />
                  <Button variant="solid" size="sm" onClick={send}>
                    Enviar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}