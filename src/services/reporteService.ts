const REPORT_FORM_URL =
  (import.meta.env.VITE_REPORT_FORM_URL as string) ||
  "http://localhost:8080/api/reports/form";

async function handleRes(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

type TextPayload = Record<string, unknown>;

/**
 * Send a report as multipart/form-data with:
 * - `payload`: JSON string
 * - `image`: optional file
 */
export async function createReporte(payload: TextPayload, file?: File | null) {
  const form = new FormData();

  form.append("payload", JSON.stringify(payload ?? {}));

  if (file) {
    form.append("image", file, file.name);
  }

  const res = await fetch(REPORT_FORM_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    // Do not set Content-Type manually when using FormData.
    body: form,
  });

  return handleRes(res);
}

export default { createReporte };
