import { useState, useEffect } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Sector } from '../types/auth';

export const useSectors = () => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'sectors'), (snapshot: any) => {
      const sectorList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Sector[];
      setSectors(sectorList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { sectors, loading };
};
