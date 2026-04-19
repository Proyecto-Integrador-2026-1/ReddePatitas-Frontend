import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import mensajesService from "../services/mensajesService";
import { Button, Card } from "../components/ui";

function getLoggedPhone() {
  try {
    const raw = localStorage.getItem("rdp_last_login");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return String(obj.phone ?? "").replace(/\D/g, "") || null;
  } catch { return null; }
}

export default function Bandeja() {
  const [convs, setConvs] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageBody, setMessageBody] = useState("");
  const currentPhone = getLoggedPhone();
  const navigate = useNavigate();
  const location = window.location;

  const activeConv = convs.find(c => c.conversationId === selectedConv) || null;

  useEffect(()=>{
    const phone = getLoggedPhone();
    if (!phone) return;
    mensajesService.getConversationsForPhone(phone).then(setConvs);
  },[]);

  // open conversation from query param ?conv=<id>
  useEffect(()=>{
    try{
      const params = new URLSearchParams(location.search);
      const conv = params.get('conv');
      if(conv) setSelectedConv(conv);
    }catch(e){}
  },[]);

  useEffect(()=>{
    if (!selectedConv) return;
    mensajesService.getMessages(selectedConv).then(async (m)=> {
      setMessages(m);
      const phone = getLoggedPhone();
      if (phone) {
        const cvs = await mensajesService.getConversationsForPhone(phone);
        setConvs(cvs);
      }
    });
  },[selectedConv]);

  const openConv = async (convId: string) => {
    const phone = getLoggedPhone();
    if (!phone) { navigate('/login'); return; }
    setSelectedConv(convId);
    await mensajesService.markMessagesRead(convId, phone);
    const m = await mensajesService.getMessages(convId);
    setMessages(m);
    // Refresh conversations so unread badges update immediately
    const cvs = await mensajesService.getConversationsForPhone(phone);
    setConvs(cvs);
  };

  const sendReply = async () => {
    const phone = getLoggedPhone();
    if (!phone || !selectedConv) return;
    // infer mascotaId and other participant
    const conv = convs.find(c => c.conversationId === selectedConv);
    const to = conv?.otherPhone;
    if (!to) return;
    await mensajesService.sendMessage({ mascotaId: conv?.mascotaId ?? null, fromPhone: phone, toPhone: to, body: messageBody });
    setMessageBody("");
    const m = await mensajesService.getMessages(selectedConv!);
    setMessages(m);
  };

  const toggleRead = async (messageId: string, currentlyRead: boolean) => {
    await mensajesService.setMessageRead(messageId, !currentlyRead);
    if (selectedConv) {
      const m = await mensajesService.getMessages(selectedConv);
      setMessages(m);
    }
    const phone = getLoggedPhone();
    if (phone) {
      const cvs = await mensajesService.getConversationsForPhone(phone);
      setConvs(cvs);
    }
  };

  return (
    <div className="p-6 relative">
      <button type="button" aria-label="Cerrar bandeja" onClick={() => navigate('/')} className="absolute right-4 top-4 text-sm text-[#716040] z-20">✕</button>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#020826] text-white" aria-hidden="false" aria-label="Logo Red de Patitas">
            <img src="/assets/huellas.svg" alt="Red de Patitas" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-semibold">Red de Patitas</p>
            <div className="text-xl font-bold text-muted-foreground">Bandeja de mensajes</div>
          </div>
        </div>
      </div>
      <Card className="p-4 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-80 border rounded p-2">
          {convs.length === 0 ? <p className="text-sm text-muted-foreground">No hay conversaciones.</p> : (
            convs.map(c => (
              <div key={c.conversationId} onClick={()=>openConv(c.conversationId)} className="mb-3 cursor-pointer">
                  <div className="bg-[#EAF4FF] border border-[#CFE6FF] rounded-lg p-3 pr-6 lg:pr-20 shadow-sm hover:shadow-md hover:bg-[#D6EEFF] transition-all relative">
                  {c.unread > 0 && (
                    <div className="absolute top-3 right-3 lg:right-4 inline-flex items-center justify-center min-w-[1.5rem] px-1 h-6 rounded-full bg-red-600 text-white text-xs">{c.unread}</div>
                  )}
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm truncate">{c.otherName ?? c.otherPhone}</div>
                        <div className="w-16 sm:w-20 text-xs text-muted-foreground text-right">{new Date(c.lastAt).toLocaleTimeString()}</div>
                      </div>
                      <div className="text-sm text-muted-foreground truncate mt-1">{c.lastMessage}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex-1 bg-white border rounded-lg p-4 relative shadow-sm">
          <button type="button" aria-label="Cerrar conversación" onClick={() => setSelectedConv(null)} className="absolute right-4 top-4 text-sm text-[#716040] z-10">✕</button>
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              {!selectedConv ? (
                <p className="text-sm text-muted-foreground">Selecciona una conversación para ver mensajes.</p>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  <div className="text-base sm:text-lg font-semibold truncate">{activeConv?.otherName ?? activeConv?.otherPhone ?? 'Conversación'}</div>
                  <div className="text-xs text-muted-foreground truncate">{activeConv?.otherName ? (activeConv?.otherPhone ? activeConv.otherPhone : '') : ''}</div>
                </div>
              )}
            </div>
          </div>
          {/* header area (single) - removed duplicate text */}

          <div className="flex flex-col gap-4">
            <div className="h-[50vh] sm:h-[60vh] lg:h-[60vh] overflow-auto p-4 flex flex-col-reverse" id="messagesScroll">
              {selectedConv ? (
                messages.slice().reverse().map(m => {
                  const isMine = (m.fromPhone === (currentPhone ?? getLoggedPhone()));
                  return (
                    <div key={m.id} className={`mb-3 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${isMine ? 'bg-[#0B3B66] text-white' : 'bg-white border'} max-w-full sm:max-w-[75%] p-3 rounded-lg shadow-sm`}>
                        <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center justify-end gap-2">
                          <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                          {isMine && <span className="text-xs">{m.readAt ? '✓✓' : '✓'}</span>}
                        </div>
                        {!isMine && (
                          <div className="mt-2 text-right">
                            <button type="button" onClick={() => toggleRead(m.id, !!m.readAt)} className="text-xs text-[#716040] hover:underline">
                              {m.readAt ? 'Marcar no leído' : 'Marcar leído'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground">Selecciona una conversación para ver mensajes.</div>
              )}
            </div>
          </div>

          {/* Reply area */}
          <div className="mt-4">
            <textarea value={messageBody} onChange={(e)=> setMessageBody(e.target.value)} className="w-full rounded-md border p-2" rows={3} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" onClick={()=> setSelectedConv(null)}>Cerrar</Button>
              <Button variant="solid" size="md" onClick={sendReply}>Enviar</Button>
            </div>
          </div>
        </div>
      </div>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/')} className="">Volver a Principal</Button>
        </div>
        <div className="text-sm text-muted-foreground"></div>
      </div>
    </div>
  );
}
