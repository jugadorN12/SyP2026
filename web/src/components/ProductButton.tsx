import React from 'react';
import { Product } from '../types/pos';
import { Lock } from 'lucide-react';

import { formatPrice } from '../utils/format';

interface ProductButtonProps {
  product: Product;
  quantityInCart: number;
  onClick: () => void;
}

const ProductButton: React.FC<ProductButtonProps> = ({ product, quantityInCart, onClick }) => {
  const isOutOfStock = (product.stockActual || 0) <= 0;
  const isLowStock = !isOutOfStock && (product.stockActual || 0) <= (product.stockMinimo || 0);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleSafeClick = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    onClick();
    // Throttle for 150ms to prevent accidental double taps on touch screens
    setTimeout(() => setIsProcessing(false), 150);
  };

  const pLista = product.precioLista || 0;

  return (
    <button
      onClick={handleSafeClick}
      disabled={isOutOfStock}
      className={`relative w-full aspect-[4/3] rounded-3xl p-4 flex flex-col items-center justify-center transition-all duration-200 shadow-lg ${
        isOutOfStock
          ? 'bg-gray-800 opacity-40 cursor-not-allowed grayscale'
          : 'active:scale-95 hover:brightness-110'
      } ${isLowStock ? 'ring-2 ring-amber-500/50' : ''}`}
      style={{
        backgroundColor: isOutOfStock ? undefined : product.color,
        color: '#1a202c' // Dark text for light warm backgrounds
      }}
    >
      {/* Traffic Light Indicator */}
      <div className="absolute top-4 left-4 flex gap-1">
        {isOutOfStock ? (
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
        ) : isLowStock ? (
          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-40"></div>
        )}
      </div>

      {/* Stock Lock Icon */}
      {isOutOfStock && (
        <div className="absolute top-4 right-4 text-gray-400">
          <Lock size={20} />
        </div>
      )}

      {/* Quantity Badge */}
      {quantityInCart > 0 && (
        <div className="absolute top-2 right-4 text-3xl font-black opacity-60">
          {quantityInCart}
        </div>
      )}

      <span className="text-xl font-bold text-center leading-tight mb-1">
        {product.nombre}
      </span>

      <span className="text-sm font-semibold opacity-70">
        ${formatPrice(pLista)}
      </span>

      {/* Small stock indicator */}
      {!isOutOfStock && product.stockActual < 10 && (
        <span className="absolute bottom-3 text-[10px] font-bold uppercase tracking-widest text-red-600">
          Quedan {product.stockActual}
        </span>
      )}
    </button>
  );
};

export default ProductButton;
