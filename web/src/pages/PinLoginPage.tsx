import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User } from '../types/auth';
import PinPad from '../components/PinPad';
import { User as UserIcon } from 'lucide-react';
import { logAction } from '../firebase/auditService';
import { comparePin } from '../utils/security';

const PinLoginPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [devClicks, setDevClicks] = useState(0);
  const [showDev, setShowDev] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), where('activo', '==', true));
        const querySnapshot = await getDocs(q);
        const fetchedUsers: User[] = [];
        querySnapshot.forEach((doc: any) => {
          fetchedUsers.push({ id: doc.id, ...doc.data() } as User);
        });
        setUsers(fetchedUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Error al conectar con la base de datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleLogoClick = () => {
    const newClicks = devClicks + 1;
    setDevClicks(newClicks);
    if (newClicks >= 7) {
      setShowDev(true);
    }
  };

  const cashiers = users.filter(u => {
    if (u.rol === 'developer') return showDev;
    return ['cajero', 'encargado_barra', 'encargado_boliche', 'dueño'].includes(u.rol);
  });

  const handlePinComplete = async (pin: string) => {
    if (!selectedUser || isLocked) return;

    if (comparePin(pin, selectedUser.pin || '')) {
      await logAction(selectedUser.id, 'LOGIN_SUCCESS', { name: selectedUser.nombre });
      localStorage.setItem('syp_session_user', JSON.stringify(selectedUser));
      window.location.href = '/pos';
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      await logAction(selectedUser.id, 'LOGIN_FAILURE', { attempts: newAttempts });

      if (newAttempts >= 3) {
        setIsLocked(true);
        setError('Acceso bloqueado por seguridad (3 intentos fallidos). Contacta al administrador.');
      } else {
        setError(`PIN incorrecto. Te quedan ${3 - newAttempts} intentos.`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-slate-400 animate-pulse">Iniciando sistema...</p>
      </div>
    );
  }

  if (error && cashiers.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 max-w-sm">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error de Conexión</h2>
          <p className="text-slate-400 mb-6">No se pudo conectar con Firebase. ¿Configuraste las llaves en el archivo .env?</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col p-6 md:p-12">
      <header className="flex justify-between items-center mb-12 select-none">
        <div onClick={handleLogoClick} className="cursor-default active:scale-95 transition-transform">
          <h1 className="text-4xl font-black text-primary-500 tracking-tight">SyP</h1>
          <p className="text-gray-400">Punto de Venta</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="text-sm text-gray-500">{new Date().toLocaleDateString()}</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-12 items-center justify-center">
        {/* User Selection Section */}
        <div className={`w-full max-w-md transition-all duration-500 ${selectedUser ? 'hidden md:block opacity-40 scale-95' : 'block opacity-100'}`}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <UserIcon className="text-primary-500" /> Selecciona tu nombre
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {cashiers.length > 0 ? (
              cashiers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-6 rounded-2xl text-left border-2 transition-all duration-200 ${
                    selectedUser?.id === user.id
                      ? 'bg-primary-600 border-primary-400 shadow-lg shadow-primary-900/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-lg">{user.nombre}</div>
                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{user.rol}</div>
                </button>
              ))
            ) : (
              <div className="col-span-2 p-8 text-center bg-slate-900 rounded-2xl border border-dashed border-slate-700 text-slate-500">
                No hay cajeros activos configurados.
              </div>
            )}
          </div>
        </div>

        {/* PIN Entry Section */}
        {selectedUser && (
          <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="mb-8 text-center md:text-left">
              <button
                onClick={() => setSelectedUser(null)}
                className="text-primary-400 text-sm mb-2 hover:underline"
              >
                ← Cambiar de usuario
              </button>
              <h2 className="text-3xl font-bold">Hola, {selectedUser.nombre}</h2>
              <p className="text-slate-400">Ingresa tu PIN de acceso</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <PinPad onComplete={handlePinComplete} />
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-slate-600 text-sm">
        <p>Solo personal autorizado • SyP Boliche 2026</p>
      </footer>
    </div>
  );
};

export default PinLoginPage;
