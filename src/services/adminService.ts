const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8080";
const BASE = `${API_BASE}/api/admin`;

function authHeaders(contentType = false) {
  const token = localStorage.getItem('rdp_token');
  const headers: Record<string,string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (contentType) headers['Content-Type'] = 'application/json';
  return headers;
}

async function handleRes(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json();
}

export async function getMetrics(userId?: string) {
  const res = await fetch(`${BASE}/metrics`, {
    method: 'GET',
    headers: { ...authHeaders(false), Accept: 'application/json' },
  });
  return handleRes(res);
}

export async function listReported(userId?: string, page = 0, size = 20) {
  const res = await fetch(`${BASE}/reported-publications?page=${page}&size=${size}`, {
    method: 'GET',
    headers: { ...authHeaders(false), Accept: 'application/json' },
  });
  if (res.status === 204) return [];
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  if (!ct.includes('application/json')) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export async function ocultarPublicacion(userId: string | undefined, reportId: string, motivo = '') {
  const res = await fetch(`${BASE}/reported-publications/${reportId}/ocultar`, {
    method: 'POST',
    headers: { ...authHeaders(true) },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function eliminarPublicacion(userId: string | undefined, reportId: string, motivo = '') {
  const res = await fetch(`${BASE}/reported-publications/${reportId}/eliminar`, {
    method: 'POST',
    headers: { ...authHeaders(true) },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function ignorarReporte(userId: string | undefined, reportId: string, motivo = '') {
  const res = await fetch(`${BASE}/reported-publications/${reportId}/ignorar`, {
    method: 'POST',
    headers: { ...authHeaders(true) },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function restaurarPublicacion(userId: string | undefined, reportId: string, motivo = '') {
  const res = await fetch(`${BASE}/reported-publications/${reportId}/restaurar`, {
    method: 'POST',
    headers: { ...authHeaders(true) },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function moderationHistory(userId?: string, page = 0, size = 50) {
  const res = await fetch(`${BASE}/moderation-history?page=${page}&size=${size}`, {
    method: 'GET',
    headers: { ...authHeaders(false), Accept: 'application/json' },
  });
  return handleRes(res);
}

export async function cleanupOldReports() {
  const res = await fetch(`${BASE}/cleanup/reports`, {
    method: 'DELETE',
    headers: { ...authHeaders(false), Accept: 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  return res.json().catch(() => null);
}

export async function getUserMetrics(userId?: string) {
  const res = await fetch(`${BASE}/user-metrics`, {
    method: 'GET',
    headers: { ...authHeaders(false), Accept: 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  return res.json().catch(() => null);
}

export async function listHiddenPublications(userId: string, page = 0, size = 50) {
  const res = await fetch(`${BASE}/hidden-publications?page=${page}&size=${size}`, {
    method: 'GET',
    headers: { ...authHeaders(false), Accept: 'application/json' },
  });
  if (res.status === 204) return [];
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  if (!ct.includes('application/json')) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export async function listDeletedPublications(userId: string, page = 0, size = 50) {
  const res = await fetch(`${BASE}/deleted-publications?page=${page}&size=${size}`, {
    method: 'GET',
    headers: { ...authHeaders(false), Accept: 'application/json' },
  });
  if (res.status === 204) return [];
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  if (!ct.includes('application/json')) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export async function blockUser(targetUserId: string, motivo = '') {
  const res = await fetch(`${BASE}/users/${targetUserId}/block`, {
    method: 'POST',
    headers: { ...authHeaders(true) },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function unblockUser(targetUserId: string, motivo = '') {
  const res = await fetch(`${BASE}/users/${targetUserId}/unblock`, {
    method: 'POST',
    headers: { ...authHeaders(true) },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function deactivateUser(targetUserId: string, motivo = '') {
  const res = await fetch(`${BASE}/users/${targetUserId}/deactivate`, {
    method: 'POST',
    headers: { ...authHeaders(true) },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function activateUser(targetUserId: string, motivo = '') {
  const res = await fetch(`${BASE}/users/${targetUserId}/activate`, {
    method: 'POST',
    headers: { ...authHeaders(true) },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export default {
  getMetrics,
  listReported,
  listHiddenPublications,
  listDeletedPublications,
  ocultarPublicacion,
  eliminarPublicacion,
  ignorarReporte,
  restaurarPublicacion,
  moderationHistory,
  cleanupOldReports,
  getUserMetrics,
  blockUser,
  unblockUser,
  deactivateUser,
  activateUser,
};
