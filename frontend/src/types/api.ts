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

export interface LocalidadResumen {
  id_localidad: number;
  localidad_nombre: string;
  departamento: string;
}

export interface Localidad extends LocalidadResumen {
  fincas: FincaResumen[];
}

export interface LocalidadInput {
  localidad_nombre: string;
  departamento: string;
}

export interface ProductorResumen {
  producto_cuit: string;
  producto_nombre: string;
}

export interface Productor extends ProductorResumen {
  fincas: FincaResumen[];
}

export interface ProductorInput {
  producto_cuit: string;
  producto_nombre: string;
}

export interface Finca {
  id_finca: number;
  finca_nombre: string;
  id_localidad: number;
  localidad: LocalidadResumen;
  productores: ProductorResumen[];
}

export interface FincaInput {
  finca_nombre: string;
  id_localidad: number;
}

export interface Camion {
  camion_patente: string;
}

export interface CamionInput {
  camion_patente: string;
}

export interface Chofer {
  chofer_dni: string;
  chofer_nombre: string;
  telefonos: string[];
}

export interface ChoferInput {
  chofer_dni: string;
  chofer_nombre: string;
  telefonos: string[];
}

export interface Ingenio {
  id_ingenio: number;
  ingenio_nombre: string;
}

export interface IngenioInput {
  ingenio_nombre: string;
}

export interface CamionResumen {
  camion_patente: string;
}

export interface ChoferResumen {
  chofer_dni: string;
  chofer_nombre: string;
}

export interface IngenioResumen {
  id_ingenio: number;
  ingenio_nombre: string;
}

export interface Viaje {
  id_viaje: string;
  id_finca: number;
  producto_cuit: string;
  camion_patente: string;
  chofer_dni: string;
  id_ingenio: number;
  num_vale: string;
  peso_bruto_kg: number;
  tara_kg: number;
  tarifa_ton: number;
  peso_neto_kg: number;
  flete: number;
  finca: FincaResumen;
  producto: ProductorResumen;
  camion: CamionResumen;
  chofer: ChoferResumen;
  ingenio: IngenioResumen;
}

export interface ViajeInput {
  id_finca: number;
  producto_cuit: string;
  camion_patente: string;
  chofer_dni: string;
  id_ingenio: number;
  num_vale: string;
  peso_bruto_kg: number;
  tara_kg: number;
  tarifa_ton: number;
}

export interface ViajeCreateInput extends ViajeInput {
  id_viaje: string;
}

export interface UsuarioCreateInput {
  usuario_nombre: string;
  password: string;
  rol: Rol;
  chofer_dni: string | null;
}

export interface UsuarioUpdateInput {
  password?: string;
  activo?: boolean;
}

export interface ApiErrorInfo {
  status: number | null;
  message: string;
  fieldErrors: Record<string, string>;
}
