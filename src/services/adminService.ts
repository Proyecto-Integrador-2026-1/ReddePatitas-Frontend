const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8080";
const BASE = `${API_BASE}/api/admin`;

async function handleRes(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json();
}

export async function getMetrics(userId: string) {
  if (!userId) throw new Error('missing_user_id');
  const res = await fetch(`${BASE}/metrics`, {
    method: 'GET',
    headers: { 'X-User-Id': String(userId), Accept: 'application/json' },
  });
  return handleRes(res);
}

export async function listReported(userId: string, page = 0, size = 20) {
  if (!userId) throw new Error('missing_user_id');
  const res = await fetch(`${BASE}/reported-publications?page=${page}&size=${size}`, {
    method: 'GET',
    headers: { 'X-User-Id': String(userId), Accept: 'application/json' },
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

export async function ocultarPublicacion(userId: string, reportId: string, motivo = '') {
  if (!userId) throw new Error('missing_user_id');
  const res = await fetch(`${BASE}/reported-publications/${reportId}/ocultar`, {
    method: 'POST',
    headers: { 'X-User-Id': String(userId), 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function eliminarPublicacion(userId: string, reportId: string, motivo = '') {
  if (!userId) throw new Error('missing_user_id');
  const res = await fetch(`${BASE}/reported-publications/${reportId}/eliminar`, {
    method: 'POST',
    headers: { 'X-User-Id': String(userId), 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function ignorarReporte(userId: string, reportId: string, motivo = '') {
  if (!userId) throw new Error('missing_user_id');
  const res = await fetch(`${BASE}/reported-publications/${reportId}/ignorar`, {
    method: 'POST',
    headers: { 'X-User-Id': String(userId), 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function restaurarPublicacion(userId: string, reportId: string, motivo = '') {
  if (!userId) throw new Error('missing_user_id');
  const res = await fetch(`${BASE}/reported-publications/${reportId}/restaurar`, {
    method: 'POST',
    headers: { 'X-User-Id': String(userId), 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function moderationHistory(userId: string, page = 0, size = 50) {
  if (!userId) throw new Error('missing_user_id');
  const res = await fetch(`${BASE}/moderation-history?page=${page}&size=${size}`, {
    method: 'GET',
    headers: { 'X-User-Id': String(userId), Accept: 'application/json' },
  });
  return handleRes(res);
}

export async function listHiddenPublications(userId: string, page = 0, size = 50) {
  if (!userId) throw new Error('missing_user_id');
  const res = await fetch(`${BASE}/hidden-publications?page=${page}&size=${size}`, {
    method: 'GET',
    headers: { 'X-User-Id': String(userId), Accept: 'application/json' },
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
  if (!userId) throw new Error('missing_user_id');
  const res = await fetch(`${BASE}/deleted-publications?page=${page}&size=${size}`, {
    method: 'GET',
    headers: { 'X-User-Id': String(userId), Accept: 'application/json' },
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
};
