import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product, Promo } from '../types/pos';
import { Tag, Trash2, Plus, Minus, Package, LayoutTemplate, Edit2, X, Save } from 'lucide-react';
import { formatPrice } from '../utils/format';

const PromosPage: React.FC = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [nombre, setNombre] = useState('');
  const [precioLista, setPrecioLista] = useState('');
  const [precioEfectivo, setPrecioEfectivo] = useState('');
  const [esCarta, setEsCarta] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{ id: string, nombre: string, cantidad: number }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap: any) => {
      setProducts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Product)));
    });
    const unsubPromos = onSnapshot(collection(db, 'promos'), (snap: any) => {
      setPromos(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Promo)));
    });
    return () => { unsubProducts(); unsubPromos(); };
  }, []);

  const handleAddItem = (productId: string) => {
    if (!productId) return;
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const exists = selectedItems.find(i => i.id === productId);
    if (exists) {
      handleUpdateItemQuantity(productId, 1);
    } else {
      setSelectedItems([...selectedItems, { id: prod.id, nombre: prod.nombre, cantidad: 1 }]);
    }
  };

  const handleUpdateItemQuantity = (id: string, delta: number) => {
    setSelectedItems(prev => prev.map(item =>
      item.id === id ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const handleEditClick = (promo: Promo) => {
    setEditingId(promo.id);
    setNombre(promo.nombre);
    setPrecioLista(promo.precioLista.toString());
    setPrecioEfectivo(promo.precioEfectivo?.toString() || '');
    setEsCarta(!!promo.esCarta);
    setSelectedItems(promo.productos);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre('');
    setPrecioLista('');
    setPrecioEfectivo('');
    setSelectedItems([]);
  };

  const handleSavePromo = async () => {
    if (!nombre || !precioLista || selectedItems.length === 0) return alert("Completa los datos");

    const pLista = parseFloat(precioLista);
    const pEfectivo = parseFloat(precioEfectivo) || pLista;

    try {
      const promoData = {
        nombre,
        precioLista: pLista,
        precioEfectivo: pEfectivo,
        productos: selectedItems,
        esCarta,
        color: '#F5F3FF' // Violet soft
      };

      if (editingId) {
        await updateDoc(doc(db, 'promos', editingId), promoData);
        alert("Promo actualizada con éxito");
      } else {
        await addDoc(collection(db, 'promos'), promoData);
        alert("Promo creada con éxito");
      }
      resetForm();
    } catch (err) {
      alert("Error al guardar promo");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 overflow-y-auto">
      <header className="mb-12">
        <h1 className="text-3xl font-black flex items-center gap-3 italic">
          <Tag className="text-violet-500" /> Gestión de Promos
        </h1>
        <p className="text-slate-500 font-medium tracking-tight">Arma combos con doble precio (Lista vs Efectivo)</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="bg-slate-900 rounded-[2.5rem] p-6 md:p-10 border border-slate-800 shadow-2xl h-fit sticky top-8">
          <div className="flex justify-between items-center mb-8">
             <h2 className="text-xl font-black uppercase tracking-widest text-slate-400">
               {editingId ? 'Editando Promo' : 'Nueva Promo'}
             </h2>
             <div className="flex gap-2">
               {editingId && (
                 <button
                   onClick={resetForm}
                   className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500 text-red-500 hover:bg-red-500/20 transition-all"
                 >
                   <X size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Cancelar</span>
                 </button>
               )}
               <button
                  onClick={() => setEsCarta(!esCarta)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${
                    esCarta ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                 >
                   <LayoutTemplate size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">{esCarta ? 'En CARTA' : 'En PROMOS'}</span>
                 </button>
             </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-600 ml-1">Nombre del Combo</label>
              <input
                value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Fernet + Coca"
                className="w-full bg-slate-800 border-none rounded-2xl p-5 text-lg font-bold outline-none focus:ring-2 focus:ring-violet-500 transition-all text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-600 ml-1">Precio Lista</label>
                <input
                  type="number" value={precioLista} onChange={e => setPrecioLista(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-800 border-none rounded-2xl p-5 text-xl font-black text-primary-400 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
                {precioLista && (
                  <div className="text-[10px] font-black text-violet-500/50 uppercase tracking-widest mt-1 ml-1">
                    Formato: ${formatPrice(parseFloat(precioLista) || 0)}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-emerald-600 ml-1">Precio Efectivo</label>
                <input
                  type="number" value={precioEfectivo} onChange={e => setPrecioEfectivo(e.target.value)}
                  placeholder={precioLista || "0"}
                  className="w-full bg-slate-800 border-none rounded-2xl p-5 text-xl font-black text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                {precioEfectivo && (
                  <div className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest mt-1 ml-1">
                    Formato: ${formatPrice(parseFloat(precioEfectivo) || 0)}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-600 ml-1">Contenido del Combo</label>
                <select
                  onChange={e => handleAddItem(e.target.value)}
                  className="w-full bg-slate-950 border-none rounded-2xl p-5 font-bold text-slate-300 appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-violet-500"
                  value=""
                >
                  <option value="">Selecciona una bebida...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-950/50 p-4 rounded-3xl border border-slate-800 animate-in slide-in-from-right-4 duration-300">
                    <span className="font-bold text-slate-200 ml-2">{item.nombre}</span>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3 bg-slate-900 rounded-xl p-1 border border-slate-800">
                        <button onClick={() => handleUpdateItemQuantity(item.id, -1)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-black text-violet-400 font-mono">{item.cantidad}</span>
                        <button onClick={() => handleUpdateItemQuantity(item.id, 1)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                      <button onClick={() => handleRemoveItem(item.id)} className="text-red-500/30 hover:text-red-500 p-2"><Trash2 size={20}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSavePromo}
              className={`w-full ${editingId ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-violet-600 hover:bg-violet-500'} text-white font-black py-6 rounded-[1.5rem] transition-all shadow-xl shadow-violet-900/20 text-xl uppercase tracking-widest active:scale-95 flex items-center justify-center gap-3`}
            >
              {editingId ? <Save size={24} /> : <Package size={24} />}
              {editingId ? 'Actualizar Promo' : `Publicar en ${esCarta ? 'CARTA' : 'PROMOS'}`}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black mb-8 uppercase tracking-widest text-slate-400">Promociones Activas</h2>
          {promos.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex justify-between items-center shadow-lg group">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black italic">{p.nombre}</h3>
                  {p.esCarta && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase rounded border border-amber-500/20">CARTA</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.productos.map((prod, i) => (
                    <span key={i} className="text-[10px] bg-slate-950 px-3 py-1.5 rounded-full text-slate-400 font-black uppercase tracking-widest border border-slate-800">
                      {prod.nombre} x{prod.cantidad}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="flex flex-col mb-2">
                   <span className="text-[10px] text-slate-600 font-black uppercase">Efectivo</span>
                   <span className="text-3xl font-black text-emerald-400 font-mono">${formatPrice(p.precioEfectivo)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(p)}
                    className="p-3 bg-primary-500/5 text-primary-500/20 hover:text-primary-500 transition-all rounded-2xl"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => { if(confirm('¿Eliminar promo?')) deleteDoc(doc(db, 'promos', p.id)) }}
                    className="p-3 bg-red-500/5 text-red-500/20 hover:text-red-500 transition-all rounded-2xl"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromosPage;
