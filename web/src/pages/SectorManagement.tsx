import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Sector, User } from '../types/auth';
import { LayoutTemplate, Edit2, Plus, Users, Save, X } from 'lucide-react';

const SectorManagement: React.FC = () => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSector, setEditingId] = useState<string | null>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'barra' | 'deposito'>('barra');
  const [cajeroAsignadoId, setCajeroAsignadoId] = useState('');

  useEffect(() => {
    const unsubSectors = onSnapshot(collection(db, 'sectors'), (snap: any) => {
      setSectors(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Sector)));
      setLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap: any) => {
        setUsers(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as User)));
    });

    return () => { unsubSectors(); unsubUsers(); };
  }, []);

  const handleSaveSector = async () => {
    if (!nombre) return alert("Completa el nombre");
    try {
      const sectorData = {
        nombre,
        tipo,
        cajeroAsignadoId: cajeroAsignadoId || null,
        activo: true
      };

      if (editingSector) {
        await updateDoc(doc(db, 'sectors', editingSector), sectorData);
        // Also update the user's sectorId if assigned
        if (cajeroAsignadoId) {
            await updateDoc(doc(db, 'users', cajeroAsignadoId), { sectorId: editingSector });
        }
        alert("Sector actualizado");
      } else {
        const docRef = await addDoc(collection(db, 'sectors'), sectorData);
        if (cajeroAsignadoId) {
            await updateDoc(doc(db, 'users', cajeroAsignadoId), { sectorId: docRef.id });
        }
        alert("Sector creado");
      }
      resetForm();
    } catch (err) {
      alert("Error al guardar sector");
    }
  };

  const handleEditClick = (s: Sector) => {
    setEditingId(s.id);
    setNombre(s.nombre);
    setTipo(s.tipo as any);
    setCajeroAsignadoId(s.cajeroAsignadoId || '');
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre('');
    setTipo('barra');
    setCajeroAsignadoId('');
    setShowModal(false);
  };

  const cashiers = users.filter(u => u.rol === 'cajero' || u.rol === 'encargado_barra');

  return (
    <div className="p-6 md:p-10 bg-slate-950 min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <LayoutTemplate className="text-primary-500" /> Gestión de Barras / Sectores
            </h1>
            <p className="text-slate-400">Configura los puntos de venta y asigna personal</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all"
          >
            <Plus size={20} /> Nueva Barra
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectors.map((s) => {
              const assignedUser = users.find(u => u.id === s.cajeroAsignadoId);
              return (
                <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-primary-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${s.tipo === 'deposito' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary-500/10 text-primary-500'}`}>
                      <LayoutTemplate size={24} />
                    </div>
                    <button onClick={() => handleEditClick(s)} className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-primary-500/10 hover:text-primary-500 transition-all">
                      <Edit2 size={18} />
                    </button>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{s.nombre}</h3>
                  <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-6">{s.tipo}</p>

                  <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                        <Users size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-black">Cajero Actual</p>
                        <p className="text-sm font-bold text-slate-200">{assignedUser?.nombre || 'Sin asignar'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">{editingSector ? 'Editar Sector' : 'Nuevo Sector'}</h2>
                <button onClick={resetForm} className="text-slate-500 hover:text-white"><X size={24}/></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Nombre del Sector</label>
                  <input
                    value={nombre} onChange={e => setNombre(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white font-bold"
                    placeholder="Ej: Barra VIP"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Tipo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setTipo('barra')}
                        className={`py-3 rounded-xl font-bold border-2 transition-all ${tipo === 'barra' ? 'bg-primary-500/10 border-primary-500 text-primary-500' : 'bg-slate-800 border-transparent text-slate-500'}`}
                    >Barra</button>
                    <button
                        onClick={() => setTipo('deposito')}
                        className={`py-3 rounded-xl font-bold border-2 transition-all ${tipo === 'deposito' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-800 border-transparent text-slate-500'}`}
                    >Depósito</button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Asignar Personal</label>
                  <select
                    value={cajeroAsignadoId} onChange={e => setCajeroAsignadoId(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white font-bold appearance-none cursor-pointer"
                  >
                    <option value="">Sin asignar</option>
                    {cashiers.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSaveSector}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-primary-900/20 mt-4 flex items-center justify-center gap-2"
                >
                  <Save size={20} /> {editingSector ? 'Guardar Cambios' : 'Crear Sector'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectorManagement;
