const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000/api";

async function handleRes(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

type TextPayload = { [key: string]: any };

/**
 * Send a report with text fields and an optional image file.
 * Fields in `payload` will be appended as form fields.
 * The file (if provided) is appended under the `foto` key.
 */
export async function createReporte(payload: TextPayload, file?: File | null) {
  const form = new FormData();

  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    // Convert objects/arrays to JSON strings, keep primitives as-is
    if (typeof v === "object") {
      try {
        form.append(k, JSON.stringify(v));
      } catch {
        form.append(k, String(v));
      }
    } else {
      form.append(k, String(v));
    }
  });

  if (file) {
    form.append("foto", file, file.name);
  }

  const res = await fetch(`${BASE}/mascotas`, {
    method: "POST",
    // NOTE: Do NOT set Content-Type header when sending FormData; browser sets the boundary
    body: form,
  });

  return handleRes(res);
}

export default { createReporte };
