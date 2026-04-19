type Message = {
  id: string;
  conversationId: string;
  mascotaId?: string | null;
  fromPhone: string;
  toPhone: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
};

import { findUsuarioByPhone } from "./usuarioService";

const KEY = "rdp_messages";

function readAll(): Message[] {
  try {
    const raw = localStorage.getItem(KEY) || "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeAll(messages: Message[]) {
  localStorage.setItem(KEY, JSON.stringify(messages));
}

function makeConversationId(mascotaId: string | undefined | null, a: string, b: string) {
  const parts = [a.replace(/\D/g, ""), b.replace(/\D/g, "")].sort();
  return `${mascotaId ?? "nopet"}::${parts.join("|")}`;
}

export async function sendMessage({ mascotaId, fromPhone, toPhone, body }: { mascotaId?: string | null; fromPhone: string; toPhone: string; body: string; }) {
  const messages = readAll();
  const conversationId = makeConversationId(mascotaId, fromPhone, toPhone);
  const msg = {
    id: `msg-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    conversationId,
    mascotaId: mascotaId ?? null,
    fromPhone: fromPhone.replace(/\D/g, ""),
    toPhone: toPhone.replace(/\D/g, ""),
    body,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  messages.push(msg);
  writeAll(messages);
  return msg;
}

export async function getConversationsForPhone(phone: string) {
  const p = phone.replace(/\D/g, "");
  const messages = readAll().filter((m) => m.fromPhone === p || m.toPhone === p);
  const grouped: Record<string, Message[]> = {};
  for (const m of messages) {
    grouped[m.conversationId] = grouped[m.conversationId] || [];
    grouped[m.conversationId].push(m);
  }
  const result = Object.keys(grouped).map((convId) => {
    const list = grouped[convId].sort((a,b)=> a.createdAt.localeCompare(b.createdAt));
    const last = list[list.length-1];
    const participants = convId.split("::")[1] || "";
    const others = participants.split("|").filter((x:any)=> x !== p);
    const otherPhone = others[0] ?? (list[0].fromPhone === p ? list[0].toPhone : list[0].fromPhone);
    const unread = list.filter((x)=> x.toPhone === p && !x.readAt).length;
    return {
      conversationId: convId,
      mascotaId: last.mascotaId,
      lastMessage: last.body,
      lastAt: last.createdAt,
      otherPhone,
      unread,
      // otherName will be resolved after map via async lookup
    };
  });
  // Resolve names for otherPhone (async lookups)
  const resolved = await Promise.all(result.map(async (r:any) => {
    let otherName: string | null = null;
    try {
      const u = await findUsuarioByPhone(r.otherPhone);
      if (u) otherName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
    } catch (e) {
      // ignore
    }
    return { ...r, otherName };
  }));

  return resolved.sort((a:any,b:any)=> b.lastAt.localeCompare(a.lastAt));
}

export async function getMessages(conversationId: string) {
  const messages = readAll().filter((m)=> m.conversationId === conversationId).sort((a,b)=> a.createdAt.localeCompare(b.createdAt));
  return messages;
}

export async function markMessagesRead(conversationId: string, readerPhone: string) {
  const p = readerPhone.replace(/\D/g, "");
  const messages = readAll();
  let changed = false;
  for (const m of messages) {
    if (m.conversationId === conversationId && m.toPhone === p && !m.readAt) {
      m.readAt = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) writeAll(messages);
}

export async function setMessageRead(messageId: string, read: boolean) {
  const messages = readAll();
  let changed = false;
  for (const m of messages) {
    if (m.id === messageId) {
      const had = !!m.readAt;
      if (read && !had) {
        m.readAt = new Date().toISOString();
        changed = true;
      } else if (!read && had) {
        m.readAt = null;
        changed = true;
      }
      break;
    }
  }
  if (changed) writeAll(messages);
}

export default { sendMessage, getConversationsForPhone, getMessages, markMessagesRead, setMessageRead };
