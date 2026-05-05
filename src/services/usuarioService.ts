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


export async function loginUsuario(emailOrPhone: string, password: string) {
  try {
    const body = { email: emailOrPhone.trim(), password: String(password ?? "") };
    const res = await fetch(LOGIN_ENDPOINT, {
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

    const data = await res.json();
    // data tiene: accessToken, refreshToken, tokenType, expiresInSeconds, roles, refreshExpiresInSeconds
    const accessToken = data?.accessToken || data?.token;
    const refreshToken = data?.refreshToken;

    // Guardar ambos tokens
    if (accessToken) {
      localStorage.setItem("rdp_token", accessToken);
    }
    if (refreshToken) {
      localStorage.setItem("rdp_refresh_token", refreshToken);
    }

    return { ok: true, token: accessToken, refreshToken, usuario: data?.usuario || data?.user };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export default {
  registerUsuario,
  loginUsuario
};