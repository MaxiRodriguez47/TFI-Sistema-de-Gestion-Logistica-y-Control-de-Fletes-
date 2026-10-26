export type Rol = "ADMIN" | "CHOFER";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  rol: Rol;
  chofer_dni: string | null;
  nombre: string;
}

export interface Usuario {
  id_usuario: number;
  usuario_nombre: string;
  rol: Rol;
  chofer_dni: string | null;
  activo: boolean;
  chofer_nombre: string | null;
}

export interface FincaResumen {
  id_finca: number;
  finca_nombre: string;
}

export interface Localidad {
  id_localidad: number;
  localidad_nombre: string;
  departamento: string;
  fincas: FincaResumen[];
}

export interface LocalidadInput {
  localidad_nombre: string;
  departamento: string;
}

export interface ApiErrorInfo {
  status: number | null;
  message: string;
  fieldErrors: Record<string, string>;
}
