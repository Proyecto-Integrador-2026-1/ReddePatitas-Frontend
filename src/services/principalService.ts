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
	const res = await fetch(REPORTS_URL);
	const data = await handleRes(res);
	if (!Array.isArray(data)) return [];
	return data.map((item) => mapReportToMascota((item ?? {}) as Record<string, unknown>));
}
