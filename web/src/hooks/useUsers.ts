import { useState, useEffect } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User } from '../types/auth';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot: any) => {
      const userList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(userList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { users, loading };
};
