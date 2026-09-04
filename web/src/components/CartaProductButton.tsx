import React from 'react';
import { Lock, Flame } from 'lucide-react';
import { formatPrice } from '../utils/format';

interface CartaProductButtonProps {
  item: any; // Using any to handle normalized fields safely
  type: 'product' | 'promo';
  quantityInCart: number;
  onClick: () => void;
  hasStock: boolean;
}

const CartaProductButton: React.FC<CartaProductButtonProps> = ({ item, type, quantityInCart, onClick, hasStock }) => {
  const isPromo = type === 'promo';

  // Design colors based on some keywords or default
  const getBrandColors = () => {
    const name = (item.nombre || '').toLowerCase();
    if (name.includes('jack')) return { bg: 'bg-[#1a1a1a]', text: 'text-[#e5e5e5]', accent: 'text-amber-500', border: 'border-amber-900/30' };
    if (name.includes('skyy')) return { bg: 'bg-[#0033a0]', text: 'text-white', accent: 'text-blue-200', border: 'border-blue-800' };
    if (name.includes('beefeater')) return { bg: 'bg-[#ff0033]', text: 'text-white', accent: 'text-red-100', border: 'border-red-900' };
    if (name.includes('absolut')) return { bg: 'bg-white', text: 'text-[#0033a0]', accent: 'text-blue-600', border: 'border-blue-100' };
    if (name.includes('grey goose')) return { bg: 'bg-slate-100', text: 'text-[#00205b]', accent: 'text-blue-800', border: 'border-blue-200' };
    if (name.includes('fernet')) return { bg: 'bg-[#004225]', text: 'text-[#f5f5dc]', accent: 'text-amber-400', border: 'border-green-900' };
    if (name.includes('chandon')) return { bg: 'bg-[#d4af37]', text: 'text-black', accent: 'text-white', border: 'border-yellow-700' };
    if (name.includes('johnnie')) return { bg: 'bg-black', text: 'text-amber-500', accent: 'text-amber-200', border: 'border-amber-900/50' };

    return { bg: 'bg-slate-900', text: 'text-white', accent: 'text-primary-400', border: 'border-slate-800' };
  };

  const colors = getBrandColors();
  const pLista = item.precioLista !== undefined ? item.precioLista : (item.precio || 0);
  const pEfectivo = item.precioEfectivo !== undefined ? item.precioEfectivo : pLista;

  return (
    <button
      onClick={onClick}
      disabled={!hasStock}
      className={`relative w-full aspect-[4/3] sm:aspect-video rounded-[2.5rem] p-6 flex flex-col justify-between transition-all duration-300 shadow-2xl border-4 ${colors.bg} ${colors.border} ${
        !hasStock ? 'opacity-30 grayscale scale-95' : 'hover:scale-[1.02] active:scale-[0.98]'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col text-left">
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${colors.accent} mb-1`}>
            {isPromo ? 'Combo Especial' : 'Premium Bottle'}
          </span>
          <h3 className={`text-xl md:text-2xl font-black italic tracking-tighter leading-none ${colors.text}`}>
            {item.nombre || 'Sin nombre'}
          </h3>
        </div>

        {!hasStock ? (
          <Lock className={colors.accent} size={24} />
        ) : (
          quantityInCart > 0 && (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xl border-2 ${colors.border} ${colors.accent} bg-black/20`}>
              {quantityInCart}
            </div>
          )
        )}
      </div>

      <div className="flex justify-between items-end">
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest line-through">
            Lista: ${formatPrice(pLista)}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl md:text-3xl font-black font-mono ${colors.text}`}>
              ${formatPrice(pEfectivo)}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase tracking-tighter`}>
              Efectivo
            </span>
          </div>
        </div>

        {isPromo && <Flame className={colors.accent} size={20} fill="currentColor" />}
      </div>
    </button>
  );
};

export default CartaProductButton;
