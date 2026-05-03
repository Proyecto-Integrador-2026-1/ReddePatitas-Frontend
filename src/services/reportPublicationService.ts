const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8080";
const ENDPOINT = `${API_BASE}/api/report-publications`;

async function getContactByReport(reportId: string, requesterId?: string) {
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
      const text = await res.text();
      const body = text ? JSON.parse(text) : null;
      const ownerCandidate = body?.ownerId || body?.owner?.id || body?.id || body?.publicadorId || body?.publicador?.id || null;
      const normalizedOwner = ownerCandidate ? String(ownerCandidate).toLowerCase().trim() : null;
      const normalizedRequester = requesterId ? String(requesterId).toLowerCase().trim() : null;
      const isOwner = Boolean(normalizedOwner && normalizedRequester && normalizedOwner === normalizedRequester);
      return { raw: body ?? null, ownerId: normalizedOwner, isOwner };
    } catch (err) {
      lastError = err;
    }
  }
  if (lastError) throw lastError;
  return { raw: null, ownerId: null, isOwner: false };
}

type ReportDto = {
  reportId: string; // id de la publicación/report
  razon: string; // p.ej. 'OTRO', 'SPAM'
  descripcion?: string;
};

async function submitReportPublication(dto: ReportDto, reporterId: string) {
  if (!reporterId) throw new Error("missing_reporter_id");

  // Prevent reporting your own publication: try to resolve owner and compare
  try {
    const contact = await getContactByReport(String(dto.reportId), reporterId);
    if (contact?.isOwner) {
      const err: any = new Error('Esta es tu publicacion');
      err.code = 400;
      throw err;
    }
  } catch (err) {
    // if getContactByReport throws a network/unknown error, we let reporting continue
    // only explicit owner match blocks reporting
  }

  // build body following requested contract
  const body: Record<string, unknown> = {
    reportId: String(dto.reportId ?? ""),
    razon: String(dto.razon ?? ""),
  };
  if (dto.descripcion) body.descripcion = String(dto.descripcion);

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": reporterId,
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 409) {
    // user already reported this publication
    const text = await res.text();
    const msg = text || "already_reported";
    const err: any = new Error(msg as string);
    err.code = 409;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }

  const responseBody = await res.json();
  return responseBody?.message ?? "Reporte enviado";
}

export default { submitReportPublication, getContactByReport };
