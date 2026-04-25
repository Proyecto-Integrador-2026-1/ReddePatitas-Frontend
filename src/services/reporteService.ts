const REPORT_FORM_URL = import.meta.env.VITE_REPORT_FORM_URL;

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
console.log("URL del fetch:", REPORT_FORM_URL);
export async function createReporte(payload: TextPayload, file?: File | null) {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload ?? {}));
  if (file) {
    form.append("image", file, file.name);
  }
  console.log("Enviando payload:", JSON.stringify(payload));
  console.log("FormData entries:");
  for (let [key, value] of form.entries()) {
    console.log(key, value);
  }

  const res = await fetch(REPORT_FORM_URL, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
  });

  // 👇 LOGS DE RESPUESTA
  console.log("Response status:", res.status);
  const responseText = await res.text();        // leer como texto para loguear
  console.log("Response body:", responseText);

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${responseText}`);
  }

  // Si la respuesta es exitosa, parsear JSON
  return JSON.parse(responseText);
}

export default { createReporte };
