export interface Usuario {
  id: number | string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  rol?: 'usuario' | 'admin' | string;
  creadoEn?: string; // ISO datetime
  [key: string]: any;
}

export type Usuarios = Usuario[];
