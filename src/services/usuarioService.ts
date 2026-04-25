import type { Usuario } from "../types/usuario";

type StoredUsuario = Usuario & {
  id: number;
  creadoEn: string;
};

type RegisterPayload = Pick<Usuario, "firstName" | "lastName" | "phone" | "email" | "password">;

const API_BASE = import.meta.env.VITE_AUTH_API_URL;
const REGISTER_ENDPOINT = `${API_BASE}/v1/auth/register`;
const LOGIN_ENDPOINT = `${API_BASE}/v1/auth/login`;
const LOCAL_KEY = "rdp_usuarios";

function normalizePhone(phone: string) {
  return String(phone ?? "").replace(/\D/g, "").trim();
}

function readLocalUsers(): StoredUsuario[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalUsers(list: StoredUsuario[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

function upsertLocalUser(user: StoredUsuario) {
  const users = readLocalUsers();
  const idx = users.findIndex((u) => normalizePhone(u.phone) === normalizePhone(user.phone));
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push(user);
  }
  writeLocalUsers(users);
}

function validateRegisterPayload(payload: RegisterPayload) {
  const firstName = String(payload.firstName ?? "").trim();
  const lastName = String(payload.lastName ?? "").trim();
  const phone = normalizePhone(payload.phone);
  const email = String(payload.email ?? "").trim();
  const password = String(payload.password ?? "");

  if (!firstName || firstName.length > 255) {
    return { ok: false as const, error: "Nombre inválido" };
  }
  if (!lastName || lastName.length > 255) {
    return { ok: false as const, error: "Apellido inválido" };
  }
  if (!/^\d{7,15}$/.test(phone)) {
    return { ok: false as const, error: "Teléfono inválido" };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false as const, error: "Email inválido" };
  }
  if (password.length < 8 || password.length > 128 || /\s/.test(password)) {
    return { ok: false as const, error: "Password inválido" };
  }

  return {
    ok: true as const,
    value: { firstName, lastName, phone, email, password },
  };
}

export async function registerUsuario(payload: RegisterPayload) {
  const validated = validateRegisterPayload(payload);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  const body = {
    nombre: validated.value.firstName,
    apellido: validated.value.lastName,
    telefono: validated.value.phone,
    email: validated.value.email,
    password: validated.value.password,
  };

  try {
    const res = await fetch(REGISTER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errorMessage = `Error ${res.status}`;
      try {
        const errorBody = await res.json();
        errorMessage =
          String(errorBody?.message || errorBody?.error || errorBody?.detail || "").trim() || errorMessage;
      } catch {
        // Keep default status message when body is not JSON.
      }
      return { ok: false, error: errorMessage };
    }

    const localRecord: StoredUsuario = {
      id: Date.now(),
      creadoEn: new Date().toISOString(),
      firstName: validated.value.firstName,
      lastName: validated.value.lastName,
      phone: validated.value.phone,
      email: validated.value.email,
      password: validated.value.password,
    };
    upsertLocalUser(localRecord);

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function updateUsuario(updated: Partial<StoredUsuario> & { id?: number; phone?: string }) {
  try {
    const users = readLocalUsers();
    const idx = users.findIndex(
      (u) => (updated.id != null && u.id === updated.id) ||
        (updated.phone != null && normalizePhone(u.phone) === normalizePhone(updated.phone))
    );

    if (idx === -1) {
      return { ok: false, error: "user_not_found" };
    }

    const merged = { ...users[idx], ...updated };
    if (typeof merged.phone === "string") {
      merged.phone = normalizePhone(merged.phone);
    }
    users[idx] = merged;
    writeLocalUsers(users);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function changePassword(phone: string, current: string, next: string) {
  try {
    if (next.length < 8 || next.length > 128 || /\s/.test(next)) {
      return { ok: false, error: "invalid_new_password" };
    }

    const users = readLocalUsers();
    const idx = users.findIndex((u) => normalizePhone(u.phone) === normalizePhone(phone));
    if (idx === -1) {
      return { ok: false, error: "user_not_found" };
    }
    if (String(users[idx].password ?? "") !== String(current ?? "")) {
      return { ok: false, error: "invalid_current_password" };
    }

    users[idx].password = String(next);
    writeLocalUsers(users);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function loginUsuario(emailOrPhone: string, password: string) {
  // prefer email-based login for backend
  try {
    const body = { email: String(emailOrPhone ?? "").trim(), password: String(password ?? "") };
    const res = await fetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let msg = `Error ${res.status}`;
      try {
        const json = await res.json();
        msg = String(json?.message || json?.error || json?.detail || msg);
      } catch {}
      return { ok: false, error: msg };
    }

    const data = await res.json();
    // expected backend shape: { token: '...', usuario: { ... } } or similar
    const token = data?.token || data?.accessToken || null;
    const usuario = data?.usuario || data?.user || null;

    // optionally persist token
    if (token) {
      localStorage.setItem("rdp_token", token);
    }

    return { ok: true, token, usuario };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export default {
  registerUsuario,
  loginUsuario,
  updateUsuario,
  changePassword,
};