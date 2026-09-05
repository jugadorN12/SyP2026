import React, { useState, useEffect } from 'react';
import { useSectors } from '../hooks/useSectors';
import { useInventory } from '../hooks/useInventory';
import { useUsers } from '../hooks/useUsers';
import { useProducts } from '../hooks/useProducts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  Clock,
  Globe
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Session } from '../types/pos';

const BarMonitorPage: React.FC = () => {
  const { sectors, loading: sectorsLoading } = useSectors();
  const { users, loading: usersLoading } = useUsers();
  const { products, loading: productsLoading } = useProducts();
  const { inventory, loading: inventoryLoading } = useInventory(); // Fetch all inventory

  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, 'sessions'), where('fecha', '==', today));
    const unsub = onSnapshot(q, (snap: any) => {
        setTodaySessions(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Session)));
    });
    return () => unsub();
  }, []);

  if (sectorsLoading || usersLoading || inventoryLoading || productsLoading) {
    return <div className="h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div></div>;
  }

  // Only consider 'barra' type sectors
  const barSectors = sectors.filter(s => s.tipo === 'barra');

  const getBarStatus = (sectorId: string) => {
    const session = todaySessions.find(s => s.sectorId === sectorId);
    const sectorInventory = inventory.filter(inv => inv.sectorId === sectorId);

    if (!session) return 'inactivo';

    // Check if any product is below minimum
    const hasAlerts = sectorInventory.some(inv => {
        const prod = products.find(p => p.id === inv.productId);
        return prod && inv.stockActual <= prod.stockMinimo;
    });

    return hasAlerts ? 'alerta' : 'ok';
  };

  const selectedSector = sectors.find(s => s.id === selectedBarId);
  const selectedCajero = users.find(u => u.id === selectedSector?.cajeroAsignadoId);
  const selectedInventory = inventory.filter(inv => inv.sectorId === selectedBarId);
  const selectedSession = todaySessions.find(s => s.sectorId === selectedBarId);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 text-primary-500 mb-2">
            <Activity size={32} />
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Monitor Real-Time</h1>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Supervisión de stock y personal por barra</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Grid of Bars */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {barSectors.map(s => {
                const status = getBarStatus(s.id);
                const cajero = users.find(u => u.id === s.cajeroAsignadoId);
                const isActive = selectedBarId === s.id;

                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedBarId(s.id)}
                    className={`relative p-8 rounded-[2.5rem] border-2 transition-all text-left flex flex-col justify-between aspect-[16/9] group ${
                      isActive
                        ? 'bg-white text-slate-950 border-white shadow-2xl scale-105'
                        : status === 'alerta'
                          ? 'bg-red-950/20 border-red-500/50 hover:bg-red-950/30'
                          : 'bg-slate-900 border-slate-800 hover:border-primary-500/50'
                    }`}
                  >
                    {status === 'alerta' && (
                      <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
                    )}

                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 block ${isActive ? 'text-slate-500' : 'text-primary-500/60'}`}>
                          {s.nombre}
                      </span>
                      <h2 className="text-3xl font-black italic tracking-tighter leading-none mb-4">
                        {cajero?.nombre || 'Vacante'}
                      </h2>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          {status === 'inactivo' ? (
                              <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-600">
                                  <Clock size={12} /> Sin Conteo
                              </div>
                          ) : status === 'alerta' ? (
                              <div className="flex items-center gap-1 text-[10px] font-black uppercase text-red-500">
                                  <AlertTriangle size={12} /> Reposición Necesaria
                              </div>
                          ) : (
                              <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-500">
                                  <CheckCircle2 size={12} /> Stock Óptimo
                              </div>
                          )}
                      </div>
                      <ChevronRight size={20} className={isActive ? 'text-slate-400' : 'text-slate-800 group-hover:text-primary-500'} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Warehouse Summary / Global Distribution */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 mt-8">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
                    <Globe size={14} /> Stock Restante en Depósito (No asignado)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.filter(p => p.activo).map(p => {
                        const totalAssigned = inventory
                            .filter(inv => inv.productId === p.id && inv.sectorId !== 'global')
                            .reduce((sum, inv) => sum + inv.stockActual, 0);
                        const inWarehouse = Math.max(0, p.stockActual - totalAssigned);

                        return (
                            <div key={p.id} className="bg-black/20 p-4 rounded-2xl border border-slate-800/50">
                                <p className="text-[10px] text-slate-600 font-bold truncate">{p.nombre}</p>
                                <p className={`text-xl font-black font-mono mt-1 ${inWarehouse === 0 ? 'text-slate-700' : 'text-primary-400'}`}>
                                    {inWarehouse}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
          </div>

          {/* Side Panel Detail */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 h-full min-h-[600px] sticky top-10 flex flex-col">
                {!selectedBarId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        <div className="w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center text-slate-800 mb-6">
                            <Info size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-500">Selecciona una barra</h3>
                        <p className="text-slate-700 text-sm mt-2 font-medium italic">Toca el botón de un cajero para ver su stock actual</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-8 pb-8 border-b border-slate-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 block mb-1">{selectedSector?.nombre}</span>
                            <h3 className="text-3xl font-black italic">{selectedCajero?.nombre}</h3>
                            <div className="flex items-center gap-2 mt-4">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${selectedSession ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {selectedSession ? 'Jornada Activa' : 'Falta Conteo Inicial'}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Detalle de Mercadería</h4>
                            <div className="space-y-4">
                                {products.filter(p => p.activo).map(p => {
                                    const inv = selectedInventory.find(i => i.productId === p.id);
                                    const currentStock = inv?.stockActual || 0;
                                    const initialStock = selectedSession?.stockInicial?.[p.id] || 0;
                                    const isLow = currentStock <= p.stockMinimo;

                                    return (
                                        <div key={p.id} className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${isLow ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-950/50 border-slate-800'}`}>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">{p.nombre}</span>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[9px] font-black uppercase text-slate-500">Ini: {initialStock}</span>
                                                    <span className="text-[9px] font-black uppercase text-slate-500">Min: {p.stockMinimo}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-2xl font-black font-mono ${isLow ? 'text-red-500' : 'text-white'}`}>
                                                    {currentStock}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedSession && (
                            <div className="mt-8 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-600">
                                    <span>Inició Turno</span>
                                    <span>{new Date(selectedSession.timestampInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarMonitorPage;
