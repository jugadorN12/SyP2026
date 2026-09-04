import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, UserRole } from '../types/auth';
import { UserPlus, Edit2, Shield, Power } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<UserRole>('cajero');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const userList: User[] = [];
      querySnapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.rol !== 'developer') {
          userList.push({ id: doc.id, ...data } as User);
        }
      });
      setUsers(userList);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'users'), {
        nombre,
        rol,
        pin, // In production, hash this!
        email: rol === 'dueño' || rol === 'encargado_boliche' ? email : '',
        activo: true,
        sectorId: 'general'
      });
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { activo: !user.activo });
      fetchUsers();
    } catch (err) {
      console.error("Error toggling user status:", err);
    }
  };

  const resetForm = () => {
    setNombre('');
    setRol('cajero');
    setPin('');
    setEmail('');
  };

  return (
    <div className="p-6 md:p-10 bg-slate-950 min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="text-primary-500" /> Gestión de Personal
            </h1>
            <p className="text-slate-400">Administra roles, accesos y PINs</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all"
          >
            <UserPlus size={20} /> Nuevo Usuario
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div
                key={user.id}
                className={`bg-slate-900 border ${user.activo ? 'border-slate-800' : 'border-red-900/50 opacity-60'} rounded-3xl p-6 transition-all`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    user.rol === 'dueño' ? 'bg-amber-500/20 text-amber-500' :
                    user.rol === 'cajero' ? 'bg-primary-500/20 text-primary-500' :
                    'bg-emerald-500/20 text-emerald-500'
                  }`}>
                    <UserIcon size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleUserStatus(user)} className={`p-2 rounded-xl transition-colors ${
                      user.activo ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                    }`}>
                      <Power size={18} />
                    </button>
                    <button className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700">
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-1">{user.nombre}</h3>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-4">{user.rol}</div>

                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">PIN de acceso:</span>
                    <span className="font-mono text-primary-400">****</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Estado:</span>
                    <span className={user.activo ? 'text-emerald-500' : 'text-red-500'}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Simplificado */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">Crear Nuevo Usuario</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nombre Completo</label>
                  <input
                    value={nombre} onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                    placeholder="Ej: Facu" required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Rol</label>
                  <select
                    value={rol} onChange={(e) => setRol(e.target.value as UserRole)}
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-white"
                  >
                    <option value="cajero">Cajero</option>
                    <option value="encargado_barra">Encargado de Barra</option>
                    <option value="encargado_boliche">Encargado de Boliche</option>
                    <option value="dueño">Dueño</option>
                  </select>
                </div>
                {rol === 'cajero' && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">PIN (4 dígitos)</label>
                    <input
                      value={pin} onChange={(e) => setPin(e.target.value)}
                      className="w-full bg-slate-800 border-none rounded-xl p-3 text-white font-mono"
                      placeholder="1234" maxLength={4} required
                    />
                  </div>
                )}
                <div className="flex gap-4 mt-8">
                  <button
                    type="button" onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Internal icon wrapper since I used Lucide but named it UserIcon in the code above
const UserIcon = ({ size, className }: { size?: number, className?: string }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default UserManagement;
