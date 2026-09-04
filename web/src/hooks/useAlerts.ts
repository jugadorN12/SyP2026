import { useMemo } from 'react';
import { Product } from '../types/pos';

export interface StockAlert {
  productId: string;
  nombre: string;
  cantidad: number;
  minimo: number;
  tipo: 'bajo' | 'critico';
}

export const useAlerts = (products: Product[]) => {
  const alerts = useMemo(() => {
    return products
      .filter(p => p.stockActual <= p.stockMinimo)
      .map(p => ({
        productId: p.id,
        nombre: p.nombre,
        cantidad: p.stockActual,
        minimo: p.stockMinimo,
        tipo: p.stockActual === 0 ? 'critico' as const : 'bajo' as const
      }));
  }, [products]);

  const criticalCount = alerts.filter(a => a.tipo === 'critico').length;
  const warningCount = alerts.filter(a => a.tipo === 'bajo').length;

  return {
    alerts,
    criticalCount,
    warningCount,
    hasAlerts: alerts.length > 0
  };
};
