import { useState, useEffect } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product } from '../types/pos';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot: any) => {
      const productList = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        // DATA NORMALIZATION: Handle old product format
        const precioLista = data.precioLista !== undefined ? data.precioLista : (data.precio || 0);
        const precioEfectivo = data.precioEfectivo !== undefined ? data.precioEfectivo : precioLista;

        return {
          id: doc.id,
          ...data,
          precioLista,
          precioEfectivo,
          stockActual: data.stockActual || 0,
          stockMinimo: data.stockMinimo || 0,
          esCarta: !!data.esCarta
        };
      }) as Product[];

      setProducts(productList);
      setLoading(false);
    }, (error: any) => {
      console.error("Firestore products error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { products, loading };
};
