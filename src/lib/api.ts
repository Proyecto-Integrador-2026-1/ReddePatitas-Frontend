export async function registerUser(data: Record<string, unknown>) {
  // Simple local storage mock for registrations
  try {
    const key = "rdp_registrations";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const record = { id: Date.now(), createdAt: new Date().toISOString(), ...(data as Record<string, unknown>) };
    existing.push(record);
    localStorage.setItem(key, JSON.stringify(existing));
    return { ok: true, id: record.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function listRegistrations() {
  const key = "rdp_registrations";
  return JSON.parse(localStorage.getItem(key) || "[]");
}

export async function registerReport(data: Record<string, unknown>) {
  try {
    const key = "rdp_reports";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const record = { id: Date.now(), createdAt: new Date().toISOString(), ...(data as Record<string, unknown>) };
    existing.push(record);
    localStorage.setItem(key, JSON.stringify(existing));
    return { ok: true, id: record.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function listReports() {
  const key = "rdp_reports";
  return JSON.parse(localStorage.getItem(key) || "[]");
}

