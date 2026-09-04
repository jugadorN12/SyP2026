export interface Product {
  id: string;
  nombre: string;
  categoria: string;
  precioLista: number;
  precioEfectivo: number;
  costo: number;
  color: string;
  activo: boolean;
  stockActual: number;
  stockMinimo: number;
  esCarta: boolean;
  proveedorTelefono?: string;
}

export interface Promo {
  id: string;
  nombre: string;
  productos: { id: string, nombre: string, cantidad: number }[];
  precioLista: number;
  precioEfectivo: number;
  color: string;
  esCarta: boolean;
}

export interface CartItem {
  id: string;
  nombre: string;
  precioLista: number;
  precioEfectivo: number;
  cantidad: number;
  type: 'product' | 'promo';
  originalItem: Product | Promo;
}

export interface Category {
  id: string;
  nombre: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'vinos', nombre: 'Vinos', color: '#FEE2E2' },
  { id: 'whiskys', nombre: 'Whiskys', color: '#FFEDD5' },
  { id: 'vodkas', nombre: 'Vodkas', color: '#E0F2FE' },
  { id: 'cervezas', nombre: 'Cervezas', color: '#FEF3C7' },
  { id: 'gaseosas', nombre: 'Gaseosas', color: '#DCFCE7' },
  { id: 'energiz', nombre: 'Energiz.', color: '#F3E8FF' },
  { id: 'agua', nombre: 'Agua', color: '#E0F7FA' },
  { id: 'champ', nombre: 'Champ.', color: '#FDF2F8' },
  { id: 'licores', nombre: 'Licores', color: '#F1F5F9' },
  { id: 'jugos', nombre: 'Jugos', color: '#FEF9C3' },
];

export type TransferStatus = 'pendiente' | 'en_transito' | 'cerrado' | 'en_disputa';

export interface Transfer {
  id: string;
  productoId: string;
  productoNombre: string;
  sectorOrigenId: string;
  sectorDestinoId: string;
  cantidadEnviada: number;
  cantidadRecibida?: number;
  estado: TransferStatus;
  usuarioSolicitaId: string;
  usuarioConfirmaSalidaId?: string;
  usuarioConfirmaEntradaId?: string;
  createdAt: number;
  sentAt?: number;
  receivedAt?: number;
}
