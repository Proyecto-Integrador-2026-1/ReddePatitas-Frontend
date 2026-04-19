import type { Usuario } from "../types/usuario";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000/api";
const LOCAL_KEY = "rdp_usuarios";

async function listUsuariosFromApi(): Promise<Usuario[]> {
	try {
		const res = await fetch(`${API_BASE}/usuarios`);
		if (!res.ok) throw new Error("API error");
		const data = await res.json();
		return Array.isArray(data) ? data : [];
	} catch (err) {
		return [];
	}
}

export async function listUsuarios(): Promise<Usuario[]> {
	// Prefer real API; fallback to localStorage
	const apiList = await listUsuariosFromApi();
	if (apiList.length > 0) return apiList;
	try {
		return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
	} catch {
		return [];
	}
}

export async function registerUsuario(payload: Omit<Usuario, "id">) {
	if (!payload.firstName || !payload.lastName || !payload.phone || !payload.password) {
		return { ok: false, error: "Faltan campos requeridos" };
	}
	const record: Usuario = { id: Date.now(), creadoEn: new Date().toISOString(), ...payload } as Usuario;

	// Try API first
	try {
		const res = await fetch(`${API_BASE}/usuarios`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(record),
		});
		if (res.ok) {
			const created = await res.json();
			return { ok: true, id: created.id ?? record.id };
		}
	} catch (err) {
		// fallthrough to localStorage
	}

	// Fallback to localStorage
	try {
		const existing = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
		existing.push(record);
		localStorage.setItem(LOCAL_KEY, JSON.stringify(existing));
		return { ok: true, id: record.id };
	} catch (err) {
		return { ok: false, error: String(err) };
	}
}

export async function findUsuarioByPhone(phone: string): Promise<Usuario | undefined> {
	const normalized = String(phone ?? "").replace(/\D/g, "").trim();
	const list = await listUsuarios();
	return list.find((u) => String(u.phone ?? "").replace(/\D/g, "").trim() === normalized);
}

export async function loginUsuario(phone: string, password: string) {
	const user = await findUsuarioByPhone(phone);
	if (!user) return { ok: false, error: "Usuario no encontrado" };
	if (user.password !== password) return { ok: false, error: "Credenciales inválidas" };
	const { password: _p, ...safe } = user as any;
	return { ok: true, usuario: safe };
}

export default {
	listUsuarios,
	registerUsuario,
	findUsuarioByPhone,
	loginUsuario,
	updateUsuario,
		changePassword,
};

// Update user profile: tries API then falls back to localStorage.
export async function updateUsuario(updated: Partial<Usuario> & { id?: any }) {
	const API_BASE_LOCAL = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000/api";
	// Try API
	try {
		if (updated.id) {
			const res = await fetch(`${API_BASE_LOCAL}/usuarios/${updated.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updated),
			});
			if (res.ok) return { ok: true };
		}
	} catch (e) {
		// ignore and fallback
	}

	// Fallback to localStorage
	try {
		const key = LOCAL_KEY;
		const raw = localStorage.getItem(key) || "[]";
		const list: any[] = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
		const idx = list.findIndex((u) => String(u.id) === String(updated.id) || String(u.phone) === String(updated.phone));
		if (idx !== -1) {
			list[idx] = { ...list[idx], ...updated };
			localStorage.setItem(key, JSON.stringify(list));
			return { ok: true };
		}
		return { ok: false, error: "user_not_found" };
	} catch (e) {
		return { ok: false, error: String(e) };
	}
}

// Change password: verifies current matches (local fallback), updates to new password.
export async function changePassword(phone: string, current: string, next: string) {
	const API_BASE_LOCAL = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000/api";
	try {
		// attempt API endpoint
		const res = await fetch(`${API_BASE_LOCAL}/usuarios/change-password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ phone, current, next }),
		});
		if (res.ok) return { ok: true };
	} catch (e) {
		// fallback
	}

	try {
		const raw = localStorage.getItem(LOCAL_KEY) || "[]";
		const list: any[] = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
		const idx = list.findIndex((u) => String(u.phone).replace(/\D/g, "") === String(phone).replace(/\D/g, ""));
		if (idx === -1) return { ok: false, error: "user_not_found" };
		if (String(list[idx].password ?? "") !== String(current)) return { ok: false, error: "invalid_current_password" };
		list[idx].password = next;
		localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
		return { ok: true };
	} catch (e) {
		return { ok: false, error: String(e) };
	}
}

