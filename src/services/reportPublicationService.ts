const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8080";
const ENDPOINT = `${API_BASE}/api/report-publications`;

type ReportDto = {
  reportId: string; // id de la publicación/report
  razon: string; // p.ej. 'OTRO', 'SPAM'
  descripcion?: string;
};
import { getValidToken } from "../utils/jwt";

async function submitReportPublication(dto: ReportDto, ownerId?: string) {
  const token = getValidToken();
  if (!token) throw new Error("missing_token");
  // Prevent reporting your own publication: if caller provides ownerId, compare directly
  try {
    if (ownerId) {
      const normalizedOwner = String(ownerId).toLowerCase().trim();
      // try to check reporter id from token
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        const normalizedReporter = String(decoded?.userid ?? decoded?.userId ?? '').toLowerCase().trim();
        if (normalizedOwner && normalizedReporter && normalizedOwner === normalizedReporter) {
          const err: any = new Error('Esta es tu publicacion');
          err.code = 400;
          throw err;
        }
      } catch {
        // ignore decoding errors, backend will validate
      }
    }
    // if no ownerId provided, we skip client-side owner check (backend should validate)
  } catch (err) {
    // no-op: only explicit owner match should block reporting
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
      Authorization: `Bearer ${token}`,
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

export default { submitReportPublication};
