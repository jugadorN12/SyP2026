import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { useInventory } from '../hooks/useInventory';
import { useSectors } from '../hooks/useSectors';
import { db } from '../firebase/config';
import { collection, setDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { PackageCheck, Save, AlertTriangle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InitialInventoryCheck: React.FC = () => {
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { sectors } = useSectors();
  const { inventory: allInventory, loading: inventoryLoading } = useInventory(); // Load ALL sectors
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.sectorId) {
        navigate('/pos');
    }
  }, [user, navigate]);

  const getAvailableForProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;

    // Sum stock of this product in OTHER sectors (exclude current user's sector)
    const otherSectorsStock = allInventory
        .filter(inv => inv.productId === productId && inv.sectorId !== user?.sectorId)
        .reduce((sum, inv) => sum + inv.stockActual, 0);

    return Math.max(0, product.stockActual - otherSectorsStock);
  };

  const handleInputChange = (productId: string, value: string) => {
    setCounts(prev => ({ ...prev, [productId]: value }));
  };

  const isInvalid = products.some(p => {
    const val = parseInt(counts[p.id] || '0');
    return val > getAvailableForProduct(p.id);
  });

  const handleConfirm = async () => {
    if (!user?.sectorId || isInvalid) return;

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const stockInicialMap: Record<string, number> = {};

      // 1. Update inventory for each product
      const inventoryPromises = products.map(async (p) => {
        const stockActual = parseInt(counts[p.id] || '0');
        stockInicialMap[p.id] = stockActual;
        const inventoryId = `${user.sectorId}_${p.id}`;
        await setDoc(doc(db, 'inventory', inventoryId), {
          sectorId: user.sectorId,
          productId: p.id,
          stockActual: stockActual,
          ultimaActualizacion: Date.now()
        }, { merge: true });
      });

      await Promise.all(inventoryPromises);

      // 2. Create session with initial stock snapshot
      await addDoc(collection(db, 'sessions'), {
        sectorId: user.sectorId,
        usuarioId: user.id,
        usuarioNombre: user.nombre,
        fecha: today,
        conteoCompletado: true,
        timestampInicio: Date.now(),
        stockInicial: stockInicialMap
      });

      // 3. Notify manager
      const sectorName = sectors.find(s => s.id === user.sectorId)?.nombre || user.sectorId;
      await addDoc(collection(db, 'notifications'), {
        tipo: 'conteo_completado',
        mensaje: `${user.nombre} completó el conteo inicial en ${sectorName}`,
        sectorId: user.sectorId,
        usuarioId: user.id,
        leida: false,
        createdAt: serverTimestamp()
      });

      alert("Inventario inicial cargado con éxito. ¡Buena jornada!");
      navigate('/pos');
    } catch (err) {
      console.error(err);
      alert("Error al guardar el inventario");
    } finally {
      setSaving(false);
    }
  };

  if (productsLoading || inventoryLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-primary-500">Cargando disponibilidad de stock...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <div className="inline-flex p-4 rounded-3xl bg-primary-500/10 text-primary-500 mb-6">
            <PackageCheck size={48} />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Conteo Inicial</h1>
          <p className="text-slate-500 font-bold">Declara el stock físico con el que recibes la barra hoy</p>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 justify-center">
            <AlertTriangle className="text-amber-500" size={20} />
            <p className="text-xs text-amber-200 font-bold uppercase tracking-widest">No puedes cargar más bebida de la disponible globalmente</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 mb-10">
          {products.filter(p => p.activo).map((product) => {
            const available = getAvailableForProduct(product.id);
            const currentInput = parseInt(counts[product.id] || '0');
            const overLimit = currentInput > available;

            return (
              <div key={product.id} className={`bg-slate-900 border rounded-3xl p-6 flex justify-between items-center transition-all ${overLimit ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-800 hover:border-slate-700'}`}>
                <div>
                  <h3 className="text-xl font-bold">{product.nombre}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Info size={12} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                        Disponible en boliche: <span className={available === 0 ? 'text-red-500' : 'text-primary-400'}>{available}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-600 font-bold uppercase">Carga:</span>
                        <input
                        type="number"
                        value={counts[product.id] || ''}
                        onChange={(e) => handleInputChange(product.id, e.target.value)}
                        placeholder="0"
                        className={`w-24 bg-slate-950 border-2 rounded-2xl p-4 text-center text-xl font-black text-white outline-none transition-all ${overLimit ? 'border-red-500 text-red-500' : 'border-slate-800 focus:border-primary-500'}`}
                        />
                    </div>
                    {overLimit && <span className="text-[9px] text-red-500 font-black uppercase">¡Supera el stock real!</span>}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleConfirm}
          disabled={saving || isInvalid}
          className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-6 rounded-[2rem] transition-all shadow-xl shadow-primary-900/20 text-2xl uppercase tracking-[0.2em] flex items-center justify-center gap-3 sticky bottom-6"
        >
          {saving ? 'Guardando...' : isInvalid ? 'Corregir Cantidades' : (
            <>
              <Save size={24} /> Confirmar y Empezar
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InitialInventoryCheck;

