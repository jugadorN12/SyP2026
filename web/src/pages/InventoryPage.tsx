import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useSectors } from '../hooks/useSectors';
import { useInventory } from '../hooks/useInventory';
import { useUsers } from '../hooks/useUsers';
import {
  Package,
  MessageCircle,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Globe,
  User as UserIcon,
  Activity
} from 'lucide-react';
import OrderSummaryModal from '../components/OrderSummaryModal';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatPrice } from '../utils/format';
import { Session } from '../types/pos';

const InventoryPage: React.FC = () => {
  const { products, loading: productsLoading } = useProducts();
  const { sectors, loading: sectorsLoading } = useSectors();
  const { users } = useUsers();
  const [selectedSectorId, setSelectedSectorId] = useState<string>('global');
  const { inventory, loading: inventoryLoading } = useInventory(selectedSectorId === 'global' ? undefined : selectedSectorId);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);

  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, 'sessions'), where('fecha', '==', today));
    const unsub = onSnapshot(q, (snap: any) => {
        setTodaySessions(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Session)));
    });
    return () => unsub();
  }, []);

  const loading = productsLoading || sectorsLoading || inventoryLoading;

  if (loading) return <div className="p-10 text-white flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div>
  </div>;

  // Find session for current sector to get initial stock
  const currentSession = todaySessions.find(s => s.sectorId === selectedSectorId);

  // Merge Data
  const displayedProducts = products.map(p => {
    if (selectedSectorId === 'global') return p;
    const inv = inventory.find(i => i.productId === p.id);
    const initial = currentSession?.stockInicial?.[p.id] !== undefined ? currentSession.stockInicial[p.id] : undefined;
    return {
        ...p,
        stockActual: inv ? inv.stockActual : 0,
        stockInicial: initial
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black mb-1 flex items-center gap-3 italic">
              <Package className="text-primary-500" /> Monitor de Stock
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium tracking-tight">Supervisión en tiempo real por barra</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
             <button
                onClick={() => setShowOrderModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-3xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-900/20 active:scale-95 text-sm md:text-base uppercase tracking-widest"
            >
                <MessageCircle size={24} />
                WhatsApp
            </button>
          </div>
        </header>

        {/* Barra Selector / Monitor Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
            <button
                onClick={() => setSelectedSectorId('global')}
                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-2 ${selectedSectorId === 'global' ? 'bg-primary-600 border-primary-400 shadow-xl scale-105' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
            >
                <Globe size={24} />
                <span className="font-black uppercase text-[10px] tracking-widest">Global</span>
            </button>
            {sectors.map(s => {
                const assignedUser = users.find(u => u.id === s.cajeroAsignadoId);
                const session = todaySessions.find(ts => ts.sectorId === s.id);
                const isActive = selectedSectorId === s.id;

                return (
                    <button
                        key={s.id}
                        onClick={() => setSelectedSectorId(s.id)}
                        className={`relative p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-1 ${isActive ? 'bg-slate-100 text-slate-950 border-white shadow-xl scale-105' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                    >
                        {!session && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
                        <span className="font-black uppercase text-[10px] tracking-widest opacity-60">{s.nombre}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <UserIcon size={14} className={isActive ? 'text-slate-900' : 'text-primary-500'} />
                            <span className="font-bold text-sm truncate">{assignedUser?.nombre || 'Vacante'}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                             <Activity size={12} className={session ? 'text-emerald-500' : 'text-slate-600'} />
                             <span className="text-[9px] font-black uppercase tracking-tighter">
                                {session ? 'Operando' : 'Sin Conteo'}
                             </span>
                        </div>
                    </button>
                );
            })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedProducts.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
              <p className="text-slate-600 font-bold italic">No hay productos cargados en el sistema</p>
            </div>
          ) : (
            displayedProducts.map(product => {
              const isCritical = product.stockActual === 0;
              const isLow = !isCritical && product.stockActual <= product.stockMinimo;
              const hasInitial = (product as any).stockInicial !== undefined;

              return (
                <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-primary-500/30 transition-all shadow-lg">
                  <div className={`absolute top-0 right-0 w-1.5 h-full ${
                    isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></div>

                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black italic">{product.nombre}</h3>
                      <div className="flex gap-2">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black px-3 py-1 bg-slate-950 rounded-full border border-slate-800">{product.categoria}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col gap-2">
                        {hasInitial && (
                            <div>
                                <p className="text-[9px] text-slate-600 font-black uppercase">Recibido</p>
                                <p className="text-xl font-black text-slate-400 font-mono">{(product as any).stockInicial}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-[9px] text-slate-600 font-black uppercase">Precio Venta</p>
                            <p className="text-sm font-bold text-primary-400">${formatPrice(product.precioLista || 0)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">Stock Actual</p>
                        <span className={`text-5xl font-black font-mono leading-none ${
                          isCritical ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-white'
                        }`}>
                          {product.stockActual}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-700 ease-out ${
                            isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min((product.stockActual / (product.stockMinimo * 3)) * 100, 100)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-[9px] text-slate-600 font-black uppercase tracking-widest">
                        <span className={isLow ? 'text-amber-600' : ''}>Mínimo: {product.stockMinimo}</span>
                        <div className="flex items-center gap-1">
                          {isCritical ? <AlertCircle size={10} className="text-red-600" /> : isLow ? <AlertTriangle size={10} className="text-amber-600" /> : <CheckCircle2 size={10} className="text-emerald-600" />}
                          <span className={isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}>
                            {isCritical ? 'Reposición Urgente' : isLow ? 'Atención: Bajo' : 'Nivel Óptimo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showOrderModal && (
        <OrderSummaryModal
          lowStockProducts={displayedProducts.filter(p => p.stockActual <= p.stockMinimo)}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </div>
  );
};

export default InventoryPage;
