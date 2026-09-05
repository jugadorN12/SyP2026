import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Session } from '../types/pos';

export const useSession = (sectorId?: string) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sectorId) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'sessions'),
      where('sectorId', '==', sectorId),
      where('fecha', '==', today),
      where('conteoCompletado', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snap: any) => {
      if (!snap.empty) {
        setActiveSession({ id: snap.docs[0].id, ...snap.docs[0].data() } as Session);
      } else {
        setActiveSession(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sectorId]);

  return { activeSession, loading };
};
