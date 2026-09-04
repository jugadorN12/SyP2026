export type UserRole = 'cajero' | 'encargado_barra' | 'encargado_boliche' | 'dueño' | 'developer';

export interface User {
  id: string;
  uid?: string; // Firebase Auth UID for admin roles
  nombre: string;
  rol: UserRole;
  pin?: string; // Hashed pin
  sectorId?: string; // Assigned bar/sector
  activo: boolean;
  email?: string; // For admin roles
}

export interface Sector {
  id: string;
  nombre: string;
  tipo: 'barra' | 'deposito_general' | 'boliche_general';
}
