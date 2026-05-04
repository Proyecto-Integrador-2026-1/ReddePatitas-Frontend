const API_BASE = import.meta.env.VITE_API_URL;

async function handleRes(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(text || `API error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
      return await res.json();
    } catch (err) {
      return null;
    }
  }
}

export async function sendMessage(
  dto: { reportId?: string | null; conversacionId?: string | null; contenido: string },
  senderId: string
) {
  if (!senderId) throw new Error('missing_user_id');
  const url = `${API_BASE}/api/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(senderId),
      Accept: 'application/json',
    },
    body: JSON.stringify(dto),
  });
  return handleRes(res);
}

export async function listConversations(requesterId: string) {
  if (!requesterId) throw new Error('missing_user_id');
  const url = `${API_BASE}/api/conversations`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-User-Id': String(requesterId),
      Accept: 'application/json',
    },
  });
  const body = await handleRes(res);
  return {
    conversations: body?.conversations ?? [],
    totalUnread: body?.totalUnread ?? 0,
  };
}

export async function getConversationMessages(conversationId: string, requesterId: string) {
  if (!requesterId) throw new Error('missing_user_id');
  const url = `${API_BASE}/api/conversations/${conversationId}/messages`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-User-Id': String(requesterId),
      Accept: 'application/json',
    },
  });
  return handleRes(res);
}

export async function markConversationAsRead(conversationId: string, requesterId: string) {
  if (!requesterId) throw new Error('missing_user_id');
  const url = `${API_BASE}/api/conversations/${conversationId}/read`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-User-Id': String(requesterId),
      Accept: 'application/json',
    },
  });
  return handleRes(res);
}

export default {
  sendMessage,
  listConversations,
  getConversationMessages,
  markConversationAsRead,
};