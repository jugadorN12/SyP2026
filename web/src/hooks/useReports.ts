import { useMemo, useState, useEffect } from 'react';
import { onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Sale } from '../types/finance';

export const useReports = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const salesList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Sale[];
      setSales(salesList);
      setLoading(false);
    }, (error: any) => {
      console.error("Firestore sales error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const metrics = useMemo(() => {
    const totalIngresos = sales.reduce((sum: number, s: Sale) => sum + s.total, 0);
    const totalUtilidad = sales.reduce((sum: number, s: Sale) => sum + s.utilidad, 0);
    const totalVentas = sales.length;
    const margenPromedio = totalIngresos > 0 ? (totalUtilidad / totalIngresos) * 100 : 0;

    return {
      totalIngresos,
      totalUtilidad,
      totalVentas,
      margenPromedio
    };
  }, [sales]);

  const salesByHour = useMemo(() => {
    const hours: Record<string, number> = {};
    sales.forEach((s: Sale) => {
      const hour = new Date(s.timestamp).getHours();
      const hourLabel = `${hour}:00`;
      hours[hourLabel] = (hours[hourLabel] || 0) + s.total;
    });

    return Object.entries(hours)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));
  }, [sales]);

  return {
    sales,
    metrics,
    salesByHour,
    loading
  };
};
