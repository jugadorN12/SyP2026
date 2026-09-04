export interface SaleItem {
  productId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  cajeroId: string;
  cajeroNombre: string;
  sectorId: string;
  items: SaleItem[];
  total: number;
  totalCosto: number;
  utilidad: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
}

export interface DailyClosure {
  id: string;
  fecha: string;
  cajeroId: string;
  sectorId: string;
  totalVentas: number;
  declaradoEfectivo: number;
  diferencia: number;
  cerrada: boolean;
  createdAt: number;
}
