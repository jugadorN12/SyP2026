import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { Package, MessageCircle, Trash2, Edit2, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import OrderSummaryModal from '../components/OrderSummaryModal';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/format';

const InventoryPage: React.FC = () => {
  const { products, loading } = useProducts();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const navigate = useNavigate();

  if (loading) return <div className="p-10 text-white flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div>
  </div>;

  const lowStockProducts = products.filter(p => p.stockActual <= p.stockMinimo);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Seguro quieres eliminar "${name}" del sistema? Esta acción no se puede deshacer.`)) {
      try {
        await deleteDoc(doc(db, 'products', id));
        alert('Producto eliminado');
      } catch (err) {
        alert('Error al eliminar producto');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black mb-1 flex items-center gap-3 italic">
              <Package className="text-primary-500" /> Estado de Inventario
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium tracking-tight">Monitoreo de stock en tiempo real y gestión de productos</p>
          </div>

          <button
            onClick={() => setShowOrderModal(true)}
            className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-3xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-900/20 active:scale-95 text-sm md:text-base uppercase tracking-widest"
          >
            <MessageCircle size={24} />
            Generar Pedido WhatsApp
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
              <p className="text-slate-600 font-bold italic">No hay productos cargados en el sistema</p>
            </div>
          ) : (
            products.map(product => {
              const isCritical = product.stockActual === 0;
              const isLow = !isCritical && product.stockActual <= product.stockMinimo;

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
                        {product.esCarta && <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500 font-black px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">CARTA</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/products?edit=${product.id}`)}
                        className="p-3 bg-slate-800 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-2xl transition-all"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.nombre)}
                        className="p-3 bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">Costo / Venta</p>
                        <p className="text-xs font-bold text-slate-400">${formatPrice(product.costo)} / <span className="text-primary-400">${formatPrice(product.precioLista || 0)}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">Stock Actual</p>
                        <span className={`text-4xl font-black font-mono leading-none ${
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
          lowStockProducts={lowStockProducts}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </div>
  );
};

export default InventoryPage;
