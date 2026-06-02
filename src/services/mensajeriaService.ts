const API_BASE = import.meta.env.VITE_API_URL;
import { getValidToken } from "../utils/jwt";

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

export async function getPetContact(petId: string) {
  const token = getValidToken();
  if (!token) throw new Error('missing_token');
  const url = `${API_BASE}/api/pets/${petId}/contact`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return handleRes(res);
}


export async function sendMessage(dto: { reportId: string; receiverId: string; content: string }) {
  const token = getValidToken();
  if (!token) throw new Error('missing_token');
  const url = `${API_BASE}/api/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(dto),
  });
  return handleRes(res);
}

export async function listConversations() {
  const token = getValidToken();
  if (!token) throw new Error('missing_token');
  const url = `${API_BASE}/api/conversations`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const body = await handleRes(res);
  const conversations = Array.isArray(body) ? body : body?.conversations ?? [];
  return {
    conversations,
    totalUnread: body?.totalUnread ?? 0,
  };
}

export async function getConversationMessages(conversationId: string) {
  const token = getValidToken();
  if (!token) throw new Error('missing_token');
  const url = `${API_BASE}/api/conversations/${conversationId}/messages`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return handleRes(res);
}

export async function markConversationAsRead(conversationId: string) {
  const token = getValidToken();
  if (!token) throw new Error('missing_token');
  const url = `${API_BASE}/api/conversations/${conversationId}/read`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return handleRes(res);
}

export async function deleteConversation(conversationId: string) {
  if (!conversationId) throw new Error('missing_conversation_id');
  const token = getValidToken();
  if (!token) throw new Error('missing_token');
  const url = `${API_BASE}/api/conversations/${conversationId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
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
  deleteConversation,
};