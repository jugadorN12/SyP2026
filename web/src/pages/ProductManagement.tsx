import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product } from '../types/pos';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Wine,
  GlassWater,
  Beer,
  Milk,
  Zap,
  Droplet,
  Sparkles,
  Cherry,
  Citrus,
  Save,
  Copy,
  Search,
  Plus,
  ArrowLeft,
  LayoutTemplate
} from 'lucide-react';
import { formatPrice } from '../utils/format';

const CATEGORY_ICONS = [
  { id: 'vinos', name: 'Vinos', icon: <Wine size={20} />, color: '#FEE2E2' },
  { id: 'whiskys', name: 'Whiskys', icon: <GlassWater size={20} />, color: '#FFEDD5' },
  { id: 'vodkas', name: 'Vodkas', icon: <Droplet size={20} />, color: '#E0F2FE' },
  { id: 'cervezas', name: 'Cervezas', icon: <Beer size={20} />, color: '#FEF3C7' },
  { id: 'gaseosas', name: 'Gaseosas', icon: <Milk size={20} />, color: '#DCFCE7' },
  { id: 'energiz', name: 'Energiz.', icon: <Zap size={20} />, color: '#F3E8FF' },
  { id: 'agua', name: 'Agua', icon: <Droplet size={20} />, color: '#E0F7FA' },
  { id: 'champ', name: 'Champ.', icon: <Sparkles size={20} />, color: '#FDF2F8' },
  { id: 'licores', name: 'Licores', icon: <Cherry size={20} />, color: '#F1F5F9' },
  { id: 'jugos', name: 'Jugos', icon: <Citrus size={20} />, color: '#FEF9C3' },
];

const ProductManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');

  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('cervezas');
  const [costo, setCosto] = useState('');
  const [precioLista, setPrecioLista] = useState('');
  const [precioEfectivo, setPrecioEfectivo] = useState('');
  const [esCarta, setEsCarta] = useState(false);
  const [stockToAdd, setStockToAdd] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot: any) => {
      setExistingProducts(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (editId) {
      const fetchEditProd = async () => {
        const prodRef = doc(db, 'products', editId);
        const snap = await getDoc(prodRef);
        if (snap.exists()) {
          const prod = snap.data() as Product;
          setNombre(prod.nombre);
          setCategoria(prod.categoria);
          setCosto(prod.costo.toString());
          setPrecioLista(prod.precioLista.toString());
          setPrecioEfectivo(prod.precioEfectivo?.toString() || '');
          setEsCarta(!!prod.esCarta);
          setStockMinimo(prod.stockMinimo.toString());
          setSelectedProductId(editId);
        }
      };
      fetchEditProd();
    }
  }, [editId]);

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    if (id === '') {
      resetForm();
      return;
    }
    const prod = existingProducts.find(p => p.id === id);
    if (prod) {
      setNombre(prod.nombre);
      setCategoria(prod.categoria);
      setCosto(prod.costo.toString());
      setPrecioLista(prod.precioLista.toString());
      setPrecioEfectivo(prod.precioEfectivo?.toString() || '');
      setEsCarta(!!prod.esCarta);
      setStockMinimo(prod.stockMinimo.toString());
      setStockToAdd('0');
    }
  };

  const numCosto = parseFloat(costo) || 0;
  const numPrecioLista = parseFloat(precioLista) || 0;
  const numPrecioEfectivo = parseFloat(precioEfectivo) || numPrecioLista;
  const numStockToAdd = parseInt(stockToAdd) || 0;
  const numMinimo = parseInt(stockMinimo) || 0;

  const ganancia = numPrecioLista - numCosto;
  const margen = numPrecioLista > 0 ? (ganancia / numPrecioLista) * 100 : 0;

  const resetForm = () => {
    setSelectedProductId('');
    setNombre('');
    setCategoria('cervezas');
    setCosto('');
    setPrecioLista('');
    setPrecioEfectivo('');
    setEsCarta(false);
    setStockToAdd('0');
    setStockMinimo('5');
    if (editId) navigate('/products');
  };

  const handleSave = async (duplicate = false) => {
    if (!nombre || numPrecioLista <= 0) return alert("Completa los datos básicos");
    setLoading(true);
    try {
      const productData = {
        nombre,
        categoria,
        costo: numCosto,
        precioLista: numPrecioLista,
        precioEfectivo: numPrecioEfectivo,
        esCarta,
        color: CATEGORY_ICONS.find(c => c.id === categoria)?.color || '#ffffff',
        stockMinimo: numMinimo,
        activo: true,
      };

      if (selectedProductId) {
        const prodRef = doc(db, 'products', selectedProductId);
        const currentProd = existingProducts.find(p => p.id === selectedProductId);
        await updateDoc(prodRef, {
          ...productData,
          stockActual: (currentProd?.stockActual || 0) + numStockToAdd,
        });
        alert("Actualizado con éxito");
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          stockActual: numStockToAdd,
        });
        alert("Creado con éxito");
      }

      if (!duplicate) resetForm();
    } catch (err) {
      console.error(err);
      alert("Error al procesar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto bg-[#1a1a1a] rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-white/5 relative">
        {editId && (
          <button onClick={() => navigate('/inventory')} className="absolute top-10 left-10 text-slate-500 hover:text-white flex items-center gap-2">
            <ArrowLeft size={20} /> <span className="font-bold text-xs uppercase tracking-widest">Volver</span>
          </button>
        )}

        <div className="text-center md:text-left mb-10">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            {selectedProductId ? 'Modificar Producto' : 'Cargar Producto'}
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-tight">Refleja la carta física con precios diferenciados</p>
        </div>

        <div className="space-y-12">
          {!editId && (
            <section className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
              <label className="text-[10px] font-black uppercase text-primary-500 tracking-[0.3em] mb-4 block ml-1">¿Ya existe en la base?</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-white font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">+ Crear Nuevo</option>
                  {existingProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stockActual})</option>
                  ))}
                </select>
              </div>
            </section>
          )}

          <section>
            <div className="flex justify-between items-center mb-4">
               <label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] block ml-1">categoría</label>
               <button
                onClick={() => setEsCarta(!esCarta)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${
                  esCarta ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
               >
                 <LayoutTemplate size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">{esCarta ? 'En Pestaña CARTA' : 'Solo en su categoría'}</span>
               </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {CATEGORY_ICONS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoria(cat.id)}
                  className={`flex flex-col items-center justify-center p-6 rounded-[1.5rem] transition-all duration-300 border-2 ${
                    categoria === cat.id
                      ? 'bg-primary-600/10 border-primary-500 text-primary-500 scale-105 shadow-xl'
                      : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'
                  }`}
                >
                  <div className="mb-3">{cat.icon}</div>
                  <span className="text-[10px] font-black uppercase">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-2 block ml-1">identificación / nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Beefeater Pink"
              className="w-full bg-transparent border-b-2 border-white/10 focus:border-primary-500 py-6 text-2xl font-black outline-none transition-all placeholder:text-slate-800 text-white italic"
            />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <section>
              <label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-4 block ml-1">costo</label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-700 italic">$</span>
                <input
                  type="number"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-white/10 focus:border-primary-500 py-4 pl-6 text-2xl font-black outline-none transition-all text-white font-mono"
                  placeholder="0"
                />
              </div>
            </section>
            <section>
              <label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-4 block ml-1">precio lista (QR/MIX)</label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-700 italic">$</span>
                <input
                  type="number"
                  value={precioLista}
                  onChange={(e) => setPrecioLista(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-white/10 focus:border-primary-500 py-4 pl-6 text-2xl font-black outline-none transition-all text-primary-400 font-mono"
                  placeholder="0"
                />
              </div>
            </section>
            <section>
              <label className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] mb-4 block ml-1">precio efectivo</label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-700 italic">$</span>
                <input
                  type="number"
                  value={precioEfectivo}
                  onChange={(e) => setPrecioEfectivo(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-emerald-500/30 focus:border-emerald-500 py-4 pl-6 text-2xl font-black outline-none transition-all text-emerald-400 font-mono"
                  placeholder={precioLista || "0"}
                />
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section>
              <label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-4 block ml-1">
                {selectedProductId ? 'sumar unidades' : 'stock inicial'}
              </label>
              <div className="relative">
                <Plus className="absolute left-0 top-1/2 -translate-y-1/2 text-primary-500" size={24} />
                <input
                  type="number"
                  value={stockToAdd}
                  onChange={(e) => setStockToAdd(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-white/10 focus:border-primary-500 py-4 pl-8 text-3xl font-black outline-none transition-all text-white font-mono"
                  placeholder="0"
                />
              </div>
            </section>
            <section>
              <label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-4 block ml-1">stock mínimo (alerta)</label>
              <input
                type="number"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                className="w-full bg-white/5 border-b-2 border-white/10 focus:border-primary-500 py-4 text-2xl font-black outline-none transition-all text-amber-500 font-mono"
                placeholder="5"
              />
            </section>
          </div>

          {(numCosto > 0 || numPrecioLista > 0) && (
            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-3xl p-8 flex justify-between items-center animate-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1">
                <span className="text-emerald-500/80 text-sm font-black uppercase tracking-[0.2em] block">margen proyectado</span>
                <span className="text-[10px] text-slate-600 font-bold italic">(Basado en Precio Lista)</span>
              </div>
              <div className="flex gap-8 items-center">
                <div className="text-right">
                  <p className="text-[9px] text-emerald-900 uppercase font-black">Porcentaje</p>
                  <span className="text-emerald-400 text-4xl font-black font-mono">{Math.round(margen)}%</span>
                </div>
                <div className="w-[1px] h-12 bg-emerald-900/30"></div>
                <div className="text-right">
                  <p className="text-[9px] text-emerald-900 uppercase font-black">Ganancia Bruta</p>
                  <span className="text-emerald-400 text-4xl font-black font-mono">${formatPrice(ganancia)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-6 pt-6">
            {!selectedProductId && (
              <button onClick={() => handleSave(true)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-6 rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/10">
                <Copy size={20} /> guardar y duplicar
              </button>
            )}
            <button
              onClick={() => handleSave(false)}
              disabled={loading}
              className={`flex-[1.5] py-6 rounded-[2rem] transition-all shadow-2xl flex items-center justify-center gap-3 text-xl font-black uppercase tracking-[0.2em] active:scale-95 ${
                selectedProductId ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-primary-600 hover:bg-primary-500 shadow-primary-900/20'
              }`}
            >
              <Save size={24} /> {selectedProductId ? 'Confirmar Cambios' : 'Registrar Producto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
