const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8080";

async function handleRes(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(text || `API error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  // handle empty body (204 or empty string)
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    // fallback to res.json() though we've already tried parsing
    try {
      return await res.json();
    } catch (err) {
      return null;
    }
  }
}

export async function getPetContact(petId: string, requesterId: string) {

  if (!requesterId) throw new Error('missing_user_id');
  const url = `${API_BASE}/api/pets/${petId}/contact`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-User-Id': String(requesterId),
      Accept: 'application/json',
    },
  });

  return handleRes(res);

}

// Try contact endpoints by reportId first, then fallback to pet endpoint.
export async function getContactByReport(reportId: string, requesterId?: string) {
  const tryUrls = [
    `${API_BASE}/api/reports/${reportId}/contact`,
    `${API_BASE}/api/pets/${reportId}/contact`,
  ];
  let lastError: any = null;
  for (const url of tryUrls) {
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (requesterId) headers['X-User-Id'] = String(requesterId);
      const res = await fetch(url, {
        method: 'GET',
        headers,
      });
      if (res.status === 404) continue;
      const body = await handleRes(res);
      // normalize possible owner fields into { ownerId, isOwner }
      const ownerCandidate = body?.ownerId || body?.owner?.id || body?.id || body?.publicadorId || body?.publicador?.id || null;
      const normalizedOwner = ownerCandidate ? String(ownerCandidate).toLowerCase().trim() : null;
      const normalizedRequester = requesterId ? String(requesterId).toLowerCase().trim() : null;
      const isOwner = Boolean(normalizedOwner && normalizedRequester && normalizedOwner === normalizedRequester);
      return { raw: body ?? null, ownerId: normalizedOwner, isOwner };
    } catch (err) {
      lastError = err;
      // try next
    }
  }
  if (lastError) throw lastError;
  return { raw: null, ownerId: null, isOwner: false };
}

export async function sendMessage(dto: { reportId?: string | null; conversacionId?: string | null; contenido: string }, senderId: string) {
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
  return handleRes(res);
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

export default { getPetContact, getContactByReport, sendMessage, listConversations, getConversationMessages, markConversationAsRead };
