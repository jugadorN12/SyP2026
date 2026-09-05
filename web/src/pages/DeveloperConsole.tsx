import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, UserRole } from '../types/auth';
import { hashPin } from '../utils/security';
import { Shield, Key, UserPlus, Search, Trash2 } from 'lucide-react';

const DeveloperConsole: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [resetting, setResetting] = useState(false);

  // New user form
  const [newNombre, setNewNombre] = useState('');
  const [newRol, setNewRol] = useState<UserRole>('dueño');
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot: any) => {
      setUsers(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as User)));
    });
    return () => unsubscribe();
  }, []);

  const handleResetSystem = async () => {
    const confirm1 = confirm("¿ESTÁS SEGURO? Esto borrará todas las VENTAS, INVENTARIOS, SESIONES y NOTIFICACIONES.");
    if (!confirm1) return;
    const confirm2 = prompt("Escribe 'ELIMINAR' para confirmar el reset de producción:");
    if (confirm2 !== 'ELIMINAR') return;

    setResetting(true);
    try {
      const collectionsToClear = ['sales', 'inventory', 'sessions', 'notifications'];

      for (const collName of collectionsToClear) {
        const q = await getDocs(collection(db, collName));
        const batch = writeBatch(db);
        q.docs.forEach((d: any) => batch.delete(d.ref));
        await batch.commit();
      }

      // Also reset product global stock to 0
      const prodSnap = await getDocs(collection(db, 'products'));
      const prodBatch = writeBatch(db);
      prodSnap.docs.forEach((d: any) => prodBatch.update(d.ref, { stockActual: 0 }));
      await prodBatch.commit();

      alert("Sistema reseteado con éxito. Datos demo eliminados.");
    } catch (err) {
      console.error(err);
      alert("Error durante el reset");
    } finally {
      setResetting(false);
    }
  };

  const handleResetPin = async (userId: string) => {
    const newPin = prompt("Ingresa el nuevo PIN de 4 dígitos:");
    if (!newPin || newPin.length < 4) return alert("PIN inválido");

    try {
      await updateDoc(doc(db, 'users', userId), {
        pin: hashPin(newPin)
      });
      alert("PIN actualizado con éxito (SHA-256)");
    } catch (err) {
      alert("Error al actualizar PIN");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newNombre && newPin.length >= 4) {
      try {
        await addDoc(collection(db, 'users'), {
          nombre: newNombre,
          rol: newRol,
          pin: hashPin(newPin),
          activo: true,
          sectorId: 'general'
        });
        alert("Usuario creado");
        setNewNombre('');
        setNewPin('');
      } catch (err) {
        alert("Error al crear usuario");
      }
    }
  };

  const filteredUsers = users.filter(u =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.rol.includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <header className="mb-12 border-b border-red-900/30 pb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 text-red-500 mb-2">
            <Shield size={32} />
            <h1 className="text-4xl font-black tracking-tighter uppercase">Dev Console</h1>
          </div>
          <p className="text-slate-500 font-mono text-sm">System integrity and access control</p>
        </div>
        <button
            onClick={handleResetSystem}
            disabled={resetting}
            className="flex items-center gap-2 px-6 py-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all font-black uppercase text-xs tracking-widest disabled:opacity-30"
        >
            <Trash2 size={18} />
            {resetting ? 'Reseteando...' : 'Reset de Producción'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuario por nombre o rol..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-mono focus:border-red-900 outline-none text-white"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-widest text-slate-500">
                <tr>
                  <th className="p-6">Usuario</th>
                  <th className="p-6">Rol</th>
                  <th className="p-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-6 font-bold">{user.nombre}</td>
                    <td className="p-6"><span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-mono">{user.rol}</span></td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => handleResetPin(user.id)}
                        className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl transition-all"
                        title="Resetear PIN"
                      >
                        <Key size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 h-fit sticky top-8">
          <h2 className="text-xl font-black mb-8 flex items-center gap-3">
            <UserPlus className="text-red-500" /> Crear Acceso Maestro
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nombre</label>
              <input
                value={newNombre} onChange={(e) => setNewNombre(e.target.value)}
                className="w-full bg-black border border-slate-800 rounded-xl p-4 mt-1 focus:border-red-900 outline-none text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Rol</label>
              <select
                value={newRol} onChange={(e) => setNewRol(e.target.value as UserRole)}
                className="w-full bg-black border border-slate-800 rounded-xl p-4 mt-1 focus:border-red-900 outline-none text-white"
              >
                <option value="developer">Developer (Super)</option>
                <option value="dueño">Dueño</option>
                <option value="encargado_boliche">Encargado Gral</option>
                <option value="encargado_barra">Encargado Barra</option>
                <option value="cajero">Cajero</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">PIN Inicial</label>
              <input
                type="password"
                value={newPin} onChange={(e) => setNewPin(e.target.value)}
                className="w-full bg-black border border-slate-800 rounded-xl p-4 mt-1 focus:border-red-900 outline-none font-mono text-white"
                maxLength={6}
              />
            </div>
            <button className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-red-900/20">
              Registrar Usuario
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeveloperConsole;
