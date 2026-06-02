import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import messagingService from '../services/mensajeriaService';
import { fetchMascotas } from '../services/principalService';
import { Avatar, Button, Badge } from '../components/ui';
import { normalizeImage, assets } from '../lib/imageUtils';
import websocketService from '../services/websocketService';

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

  // ============================================
  // Función para normalizar una conversación (reutilizable)
  // ============================================
  const normalizeConversation = (c: any, reportsIndex: Record<string, any> | null, currentUserId: string) => {
    const id = c.id || c.userConversationId || c.user_conversation_id || c.userConversation?.id || '';
    const conversationId = c.conversationId || c.conversacionId || c.conversation?.id || '';
    const reportCandidateId = c.report?.id || c.reportId || null;
    const reportEntry = reportCandidateId && reportsIndex ? reportsIndex[reportCandidateId] : null;

    const mascotaName = reportEntry?.nombre || reportEntry?.pet?.nombre || c?.mascota?.nombre || c.mascotaName || 'Mascota sin nombre';

    const rawThumbCandidates = [
      reportEntry?.thumbnail_url, reportEntry?.imagen_url, reportEntry?.imagen, reportEntry?.image,
      c.mascota?.thumbnail_url, c.mascota?.imagen_url, c.thumbnail,
      c.report?.pet?.thumbnail_url, c.report?.pet?.imagen_url,
    ];
    const rawThumb = rawThumbCandidates.find(Boolean) || '';
    let thumbnail = normalizeImage(rawThumb);
    if (!rawThumb || thumbnail === assets.max) thumbnail = assets.max;

    const rawOwner = c.otherUserId ?? c.ownerId ?? (c.owner && (c.owner.id ?? c.owner)) ?? c.publicadorId ?? null;
    const ownerIdStr = rawOwner != null ? String(rawOwner) : null;
    const normalizedOwner = ownerIdStr ? String(ownerIdStr).toLowerCase().trim() : null;
    const normalizedUser = currentUserId ? String(currentUserId).toLowerCase().trim() : null;
    const publisherId = (normalizedOwner && normalizedUser && normalizedOwner === normalizedUser && c.userId2)
      ? String(c.userId2)
      : (ownerIdStr || c.publisherId || c.publicadorId || c.otherUserId || '');
    const publisherName = c.otherUserName || c.publisher?.displayName || c.publisherName || '';

    const lastMessage = c.lastMessage || c.ultimoMensaje || c.last || null;
    const unreadCount = Number(c.unreadCount ?? c.unread ?? 0);

    return {
      ...c,
      id: String(id),
      conversationId: String(conversationId || ''),
      mascotaName,
      thumbnail,
      publisherId,
      publisherName,
      lastMessage,
      unreadCount,
      reportId: reportCandidateId,
      ownerId: ownerIdStr,
    };
  };

  // ============================================
  // Función para recargar conversaciones (reutilizable)
  // ============================================
  const refreshConversations = async () => {
    if (!userId) return;
    try {
      const resp = await messagingService.listConversations();
      const rawConvs = Array.isArray(resp?.conversations) ? resp.conversations : [];

      // Cargar reportsIndex para nombres de mascotas
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

      const processedConvs = rawConvs.map((c: any) => normalizeConversation(c, reportsIndex, userId));
      setConversations(processedConvs);

      // Actualizar conversación seleccionada si existe
      if (selectedConv) {
        const updated = processedConvs.find((c: any) => c.id === selectedConv.id);
        if (updated) setSelectedConv(updated);
      }
    } catch (err) {
      console.error('Error refreshing conversations:', err);
    }
  };

  // ============================================
  // Función para recargar mensajes de una conversación
  // ============================================
  const refreshMessages = async (conversationId: string) => {
    if (!userId) return;
    try {
      const msgs = await messagingService.getConversationMessages(conversationId);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Error refreshing messages:', err);
    }
  };

  // ============================================
  // Carga inicial de conversaciones (simplificado, reutiliza refreshConversations)
  // ============================================
  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      setLoadingConvs(true);
      await refreshConversations();
      setLoadingConvs(false);
    };

    load();

    const iv = setInterval(() => {
      if (mounted) refreshConversations();
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [userId]);

  // ============================================
  // Escuchar eventos WebSocket para actualizar conversaciones y mensajes en tiempo real
  // ============================================
  useEffect(() => {
    if (!userId) return;

    // Handler para nuevo mensaje
    const handleNewMessage = (notification: any) => {
      console.log('📨 Bandeja: Nuevo mensaje recibido', notification);

      // Actualizar lista de conversaciones (recargar)
      refreshConversations();

      // Si la conversación activa es la que recibió el mensaje, recargar mensajes
      if (selectedConv && notification.userConversationId === selectedConv.id) {
        refreshMessages(selectedConv.id);
      }
    };

    // Handler para mensajes leídos
    const handleMessagesRead = (notification: any) => {
      console.log('✓ Bandeja: Mensajes marcados como leídos', notification);
      refreshConversations();
    };

    // Handler para conversación eliminada
    const handleConversationDeleted = (notification: any) => {
      console.log('🗑️ Bandeja: Conversación eliminada', notification);
      refreshConversations();

      // Si la conversación eliminada era la seleccionada, cerrarla
      if (selectedConv && notification.userConversationId === selectedConv.id) {
        setSelectedConv(null);
        setMessages([]);
      }
    };

    // Registrar handlers
    websocketService.on('NEW_MESSAGE', handleNewMessage);
    websocketService.on('MESSAGE_READ', handleMessagesRead);
    websocketService.on('CONVERSATION_DELETED', handleConversationDeleted);

    return () => {
      websocketService.off('NEW_MESSAGE', handleNewMessage);
      websocketService.off('MESSAGE_READ', handleMessagesRead);
      websocketService.off('CONVERSATION_DELETED', handleConversationDeleted);
    };
  }, [userId, selectedConv]);

  // ============================================
  // Cargar mensajes cuando se selecciona una conversación
  // ============================================
  useEffect(() => {
    if (!selectedConv) return;
    let mounted = true;

    const loadMsgs = async () => {
      setLoadingMsgs(true);
      try {
        const msgs = await messagingService.getConversationMessages(selectedConv.id);
        if (!mounted) return;
        setMessages(Array.isArray(msgs) ? msgs : []);
        setConversations((prev) => prev.map((p: any) => (p.id === selectedConv.id ? { ...p, unreadCount: 0 } : p)));
      } catch (err) {
        console.error('Error cargando mensajes', err);
      } finally {
        setLoadingMsgs(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      (async () => {
        try {
          await messagingService.markConversationAsRead(selectedConv.id);
        } catch (e) {}
      })();
    };

    loadMsgs();

    const iv = setInterval(loadMsgs, 30000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [selectedConv, userId]);

  const selectConv = (conv: any) => {
    setSelectedConv(conv);
  };

  const send = async () => {
    if (!texto.trim() || !userId) return;
    try {
      const receiverId =
        selectedConv?.otherUserId ||
        selectedConv?.publisherId ||
        selectedConv?.ownerId ||
        selectedConv?.userId2 ||
        '';
      const reportId = selectedConv?.reportId || selectedConv?.report?.id || '';
      const dto = { reportId, receiverId, content: texto };
      await messagingService.sendMessage(dto);
      setTexto('');
      const msgs = await messagingService.getConversationMessages(selectedConv.id);
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

    const pid =
      conv.publisherId ??
      conv.publisher?.id ??
      conv.ownerId ??
      conv.owner?.id ??
      conv.publicadorId ??
      conv.publicador?.id ??
      conv.usuarioId ??
      conv.userId ??
      (conv.participants && Array.isArray(conv.participants) && conv.participants[0]?.id) ??
      null;
    const normPid = pid ? String(pid).toLowerCase().trim() : null;
    const normUser = user?.id ? String(user.id).toLowerCase().trim() : null;
    if (pid && normPid && normUser && normPid === normUser) return user?.username || (user as any)?.nombre || 'Yo';

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
                    <div key={conv.id} className="group relative">
                      <button
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
                            {badge > 0 && <Badge className="bg-[#8c7851] text-white">{badge}</Badge>}
                          </div>
                          <div className="truncate text-xs text-[#716040]">{conv.mascotaName || 'Mascota sin nombre'}</div>
                        </div>
                      </button>

                      {/* Botón eliminar - aparece al hacer hover */}
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-red-100 transition-all duration-200"
                        aria-label={`Eliminar conversación con ${name}`}
                        title={`Eliminar conversación con ${name}`}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar conversación con ${name}? Esta acción no se puede deshacer.`)) {
                            try {
                              await messagingService.deleteConversation(conv.id);
                              setConversations(prev => prev.filter(c => c.id !== conv.id));
                              if (selectedConv?.id === conv.id) {
                                setSelectedConv(null);
                                setMessages([]);
                              }
                            } catch (err) {
                              console.error('Error eliminando conversación:', err);
                              alert('No se pudo eliminar la conversación');
                            }
                          }
                        }}
                      >
                        <svg className="w-4 h-4 text-red-500 hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
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
                              isMine ? 'bg-[#020826] text-white' : 'bg-[#f9f4ef] text-[#020826]'
                            }`}
                          >
                            {msg.content || msg.contenido || msg.texto || msg.body || ''}
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