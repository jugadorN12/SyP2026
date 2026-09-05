import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { InventoryItem } from '../types/pos';

export const useInventory = (sectorId?: string) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const baseQuery = collection(db, 'inventory');
    const q = sectorId ? query(baseQuery, where('sectorId', '==', sectorId)) : baseQuery;

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const itemList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
      setInventory(itemList);
      setLoading(false);
    }, (error: any) => {
      console.error("Firestore inventory error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sectorId]);

  return { inventory, loading };
};
