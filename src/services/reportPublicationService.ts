const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8080";
const ENDPOINT = `${API_BASE}/api/report-publications`;

type ReportDto = {
  reportId: string; // id de la publicación/report
  razon: string; // p.ej. 'OTRO', 'SPAM'
  descripcion?: string;
};

async function submitReportPublication(dto: ReportDto, reporterId: string) {
  if (!reporterId) throw new Error("missing_reporter_id");

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

export default { submitReportPublication };
