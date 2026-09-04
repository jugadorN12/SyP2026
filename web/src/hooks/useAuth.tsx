import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User, UserRole } from '../types/auth';

import { comparePin } from '../utils/security';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAuthorized: (allowedRoles: UserRole[]) => boolean;
  validatePin: (userId: string, pin: string) => Promise<boolean>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState<Record<string, number>>({});
  const [lockUntil, setLockUntil] = useState<Record<string, number>>({});
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as User);
        } else {
          setUser(null);
        }
      } else {
        const sessionUser = localStorage.getItem('syp_session_user');
        if (sessionUser) {
          setUser(JSON.parse(sessionUser));
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();
    localStorage.removeItem('syp_session_user');
    setUser(null);
  };

  const isAuthorized = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    // Developer role always has access
    if (user.rol === 'developer') return true;
    return allowedRoles.includes(user.rol);
  };

  const validatePin = async (userId: string, inputPin: string): Promise<boolean> => {
    const now = Date.now();
    if (lockUntil[userId] && now < lockUntil[userId]) {
      const remaining = Math.ceil((lockUntil[userId] - now) / 1000);
      setAuthError(`Bloqueado por ${remaining}s`);
      return false;
    }

    // STRICT: Always fetch from Firestore for real-time security
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        setAuthError("Usuario no encontrado");
        return false;
      }

      const userData = userDoc.data() as User;

      // Check if pin matches hash
      if (comparePin(inputPin, userData.pin || '')) {
        setFailedAttempts(prev => ({ ...prev, [userId]: 0 }));
        setAuthError(null);
        const sessionData = { ...userData, id: userDoc.id };
        localStorage.setItem('syp_session_user', JSON.stringify(sessionData));
        setUser(sessionData);
        return true;
      } else {
        const attempts = (failedAttempts[userId] || 0) + 1;
        setFailedAttempts(prev => ({ ...prev, [userId]: attempts }));

        if (attempts >= 3) {
          setLockUntil(prev => ({ ...prev, [userId]: now + 30000 })); // 30s lock
          setAuthError("Demasiados intentos. Bloqueado por 30s.");
        } else {
          setAuthError(`PIN incorrecto. Intento ${attempts}/3`);
        }
        return false;
      }
    } catch (err) {
      console.error("Auth error:", err);
      setAuthError("Error de conexión");
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, isAuthorized, validatePin, authError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
