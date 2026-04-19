import type { Mascota, Mascotas } from "../types/mascota";

const REPORTS_URL =
	(import.meta.env.VITE_REPORTS_URL as string) ||
	"http://localhost:8080/api/reports";

async function handleRes(res: Response) {
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`API error ${res.status}: ${text}`);
	}
	return res.json();
}

const toNumber = (value: unknown): number | undefined => {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() !== "") {
		const n = Number(value);
		return Number.isFinite(n) ? n : undefined;
	}
	return undefined;
};

const mapReportToMascota = (report: Record<string, unknown>): Mascota => {
	const latitud = toNumber(report.latitud);
	const longitud = toNumber(report.longitud);

	return {
		id: String(report.id ?? ""),
		nombre: String(report.nombre ?? "Sin nombre"),
		tipo: String(report.tipo ?? report.tipoMascota ?? "Mascota"),
		estado: String(report.estado ?? report.tipoReporte ?? "encontrado"),
		descripcion: String(report.descripcion ?? ""),
		fecha_desaparicion: String(report.fecha_desaparicion ?? report.fechaEvento ?? ""),
		lugar_desaparicion: String(report.lugar_desaparicion ?? report.lugarDesaparicion ?? ""),
		latitud,
		longitud,
		fecha_publicacion: String(report.fecha_publicacion ?? report.fechaCreacion ?? report.creadoEn ?? ""),
		imagen_url: String(report.imagen_url ?? report.imagenUrl ?? ""),
		thumbnail_url: String(report.thumbnail_url ?? report.thumbnailUrl ?? ""),
	};
};

export async function fetchMascotas(): Promise<Mascotas> {
	// If local seeded mascotas exist, prefer them so QA can test without backend
	try {
		const raw = localStorage.getItem("rdp_mascotas");
		if (raw) {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				return parsed.map((item: any) => ({
					id: String(item.id ?? ""),
					nombre: String(item.nombre ?? "Sin nombre"),
					tipo: String(item.tipo ?? "Mascota"),
					estado: String(item.estado ?? "ENCONTRADO"),
					descripcion: String(item.descripcion ?? ""),
					fecha_desaparicion: String(item.fecha_desaparicion ?? ""),
					lugar_desaparicion: String(item.lugar_desaparicion ?? ""),
					latitud: typeof item.latitud === "number" ? item.latitud : undefined,
					longitud: typeof item.longitud === "number" ? item.longitud : undefined,
					fecha_publicacion: String(item.fecha_publicacion ?? item.creadoEn ?? ""),
					imagen_url: String(item.imagen_url ?? item.url_imagen ?? ""),
					thumbnail_url: String(item.thumbnail_url ?? item.url_imagen ?? ""),
					telefono: String(item.telefono ?? item.phone ?? ""),
					propietario: String(item.propietario ?? item.owner ?? item.contact_name ?? ""),
				} as Mascota));
			}
		}
	} catch (e) {
		console.debug("local mascotas parse failed:", e);
	}

	try {
		const res = await fetch(REPORTS_URL);
		const data = await handleRes(res);
		if (!Array.isArray(data)) return [];
		return data.map((item) => mapReportToMascota((item ?? {}) as Record<string, unknown>));
	} catch (err) {
		// Fallback to localStorage for dev/offline testing
		try {
			const raw = localStorage.getItem("rdp_mascotas");
			if (!raw) return [];
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];
			return parsed.map((item: any) => ({
				id: String(item.id ?? ""),
				nombre: String(item.nombre ?? "Sin nombre"),
				tipo: String(item.tipo ?? "Mascota"),
				estado: String(item.estado ?? "ENCONTRADO"),
				descripcion: String(item.descripcion ?? ""),
				fecha_desaparicion: String(item.fecha_desaparicion ?? ""),
				lugar_desaparicion: String(item.lugar_desaparicion ?? ""),
					latitud: typeof item.latitud === "number" ? item.latitud : undefined,
					longitud: typeof item.longitud === "number" ? item.longitud : undefined,
				fecha_publicacion: String(item.fecha_publicacion ?? item.creadoEn ?? ""),
				imagen_url: String(item.imagen_url ?? item.url_imagen ?? ""),
				thumbnail_url: String(item.thumbnail_url ?? item.url_imagen ?? ""),
					telefono: String(item.telefono ?? item.phone ?? ""),
					propietario: String(item.propietario ?? item.owner ?? item.contact_name ?? ""),
			} as Mascota));
		} catch (e) {
			console.debug("fetchMascotas fallback failed:", e);
			return [];
		}
	}
}
