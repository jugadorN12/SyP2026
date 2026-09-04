import React from 'react';
import { CartItem } from '../types/pos';
import { RotateCcw, Trash2 } from 'lucide-react';
import { formatPrice } from '../utils/format';

interface CartSidebarProps {
  items: CartItem[];
  total: number;
  onUndo: () => void;
  onClear: () => void;
  onCheckout: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ items, total, onUndo, onClear, onCheckout }) => {
  return (
    <div className="w-full md:w-80 lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Venta actual</h2>
        <button
          onClick={onClear}
          className="text-slate-500 hover:text-red-400 p-2 transition-colors"
          title="Vaciar carrito"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-2">
              🛒
            </div>
            <p className="text-sm">El carrito está vacío</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex justify-between items-center group animate-in slide-in-from-right-4 duration-200">
              <div className="flex flex-col">
                <span className="text-white font-bold">{item.nombre} x{item.cantidad}</span>
                <span className="text-xs text-slate-500">${formatPrice(item.precioLista)} c/u</span>
              </div>
              <span className="text-primary-400 font-mono font-bold">
                ${formatPrice(item.precioLista * item.cantidad)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="p-6 bg-slate-800/30 space-y-6">
        <button
          onClick={onUndo}
          disabled={items.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-white disabled:opacity-30 transition-colors border border-slate-700 rounded-xl"
        >
          <RotateCcw size={18} />
          <span>deshacer último</span>
        </button>

        <div className="space-y-1">
          <div className="flex justify-between items-end">
            <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">total</span>
            <span className="text-4xl font-black text-white font-mono">
              ${formatPrice(total)}
            </span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-2xl font-black py-6 rounded-2xl transition-all shadow-xl shadow-primary-900/20 active:scale-[0.98]"
        >
          cobrar
        </button>
      </div>
    </div>
  );
};

export default CartSidebar;
