export interface Mascota {
  id: string;
  nombre: string;
  tipo: 'Perro' | 'Gato' | string;
  estado: string;
  descripcion?: string;
  fecha_desaparicion?: string; // ISO date
  lugar_desaparicion?: string;
  latitud?: number;
  longitud?: number;
  fecha_publicacion?: string; // ISO datetime
  url_imagen?: string;
}

export type Mascotas = Mascota[];
