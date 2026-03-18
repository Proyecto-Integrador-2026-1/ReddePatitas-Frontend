import type { Mascota, Mascotas } from "../types/mascota";

const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000/api";

async function handleRes(res: Response) {
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`API error ${res.status}: ${text}`);
	}
	return res.json();
}

export async function fetchMascotas(): Promise<Mascotas> {
	const res = await fetch(`${BASE}/mascotas`);
	return handleRes(res) as Promise<Mascotas>;
}

export async function fetchMascota(id: string): Promise<Mascota> {
	const res = await fetch(`${BASE}/mascotas/${id}`);
	return handleRes(res) as Promise<Mascota>;
}

export async function createMascota(data: Partial<Mascota>): Promise<Mascota> {
	const res = await fetch(`${BASE}/mascotas`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	return handleRes(res) as Promise<Mascota>;
}

export async function updateMascota(id: string, data: Partial<Mascota>): Promise<Mascota> {
	const res = await fetch(`${BASE}/mascotas/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	return handleRes(res) as Promise<Mascota>;
}

export async function deleteMascota(id: string): Promise<void> {
	const res = await fetch(`${BASE}/mascotas/${id}`, { method: "DELETE" });
	if (!res.ok) throw new Error(`Failed to delete mascota ${id}`);
}
