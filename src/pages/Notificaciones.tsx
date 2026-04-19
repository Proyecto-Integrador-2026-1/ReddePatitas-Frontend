import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "../components/ui";
import mensajesService from "../services/mensajesService";

function getLoggedPhone() {
  try {
    const raw = localStorage.getItem("rdp_last_login");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return String(obj.phone ?? "").replace(/\D/g, "") || null;
  } catch { return null; }
}

export default function Notificaciones(){
  const [items, setItems] = useState<any[]>([]);
  const navigate = useNavigate();

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch { return iso; }
  };

  useEffect(()=>{
    const phone = getLoggedPhone();
    if(!phone) return;

    (async ()=>{
      // message notifications: one per conversation
      const convs = await mensajesService.getConversationsForPhone(phone);
      const msgs = convs.map((c:any)=>({
        id: `msg-${c.conversationId}`,
        type: 'message',
        title: `Mensaje de ${c.otherName ?? c.otherPhone}`,
        body: c.lastMessage,
        time: c.lastAt,
        conversationId: c.conversationId,
        unread: c.unread || 0,
      }));

      // report notifications (local fallback)
      const reportsRaw = localStorage.getItem('rdp_reports') || '[]';
      let reports: any[] = [];
      try{ reports = Array.isArray(JSON.parse(reportsRaw)) ? JSON.parse(reportsRaw) : []; }catch(e){}
      const repItems = reports.map(r=>({
        id: `rep-${r.id}`,
        type: 'report',
        title: 'Reporte enviado',
        body: r.reason || '',
        time: r.createdAt,
        meta: r,
      }));

      // sort: unread first, then by time desc
      const all = [...msgs, ...repItems].sort((a,b)=> {
        const au = Number((a as any).unread || 0);
        const bu = Number((b as any).unread || 0);
        if (au !== bu) return bu - au;
        return String(b.time||'').localeCompare(String(a.time||''));
      });
      setItems(all);
    })();
  },[]);

  const openItem = (it: any) => {
    if(it.type === 'message'){
      // go to bandeja and open conversation
      navigate(`/bandeja?conv=${encodeURIComponent(it.conversationId)}`);
    } else if(it.type === 'report'){
      // open reports page or show toast - fallback to principal
      navigate('/');
      alert('Reporte: ' + (it.body || 'enviado'));
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-screen-lg relative">
        <button aria-label="Cerrar notificaciones" onClick={() => navigate('/')} className="absolute right-3 top-3 text-sm text-[#716040] rounded hover:bg-white/80 p-1">✕</button>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#020826] text-white" aria-hidden="false" aria-label="Logo Red de Patitas">
              <img src="/assets/huellas.svg" alt="Red de Patitas" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-semibold">Red de Patitas</p>
              <div className="text-xl font-bold text-muted-foreground">Notificaciones</div>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No hay notificaciones.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {items.map(it => (
              <Card key={it.id} className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#EAF4FF] border-[#CFE6FF] hover:bg-[#D6EEFF]`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-sm sm:text-base">{it.title}</div>
                    <div className="text-xs text-muted-foreground">{formatTime(it.time)}</div>
                  </div>
                  {it.body && <div className="text-sm text-[#716040] mt-2 whitespace-pre-wrap">{it.body}</div>}
                </div>

                <div className="mt-3 sm:mt-0 sm:ml-4 flex items-center gap-2">
                  {it.unread ? <div className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-red-600 text-white text-xs font-bold">{it.unread}</div> : null}
                  <Button variant="ghost" size="sm" onClick={() => openItem(it)}>Abrir</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center">
          <div className="flex-1">
            <Button variant="outline" size="md" onClick={() => navigate('/')}>Volver a Principal</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
