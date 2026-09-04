import { useState } from 'react';
import { Product, Promo, CartItem } from '../types/pos';

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addProductToCart = (product: Product) => {
    if (product.stockActual <= 0) return;

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id && item.type === 'product');
      if (existingItem) {
        return prevItems.map(item =>
          (item.id === product.id && item.type === 'product')
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prevItems, {
        id: product.id,
        nombre: product.nombre,
        precioLista: product.precioLista || 0,
        precioEfectivo: product.precioEfectivo || product.precioLista || 0,
        cantidad: 1,
        type: 'product',
        originalItem: product
      }];
    });
  };

  const addPromoToCart = (promo: Promo) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === promo.id && item.type === 'promo');
      if (existingItem) {
        return prevItems.map(item =>
          (item.id === promo.id && item.type === 'promo')
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prevItems, {
        id: promo.id,
        nombre: promo.nombre,
        precioLista: promo.precioLista || 0,
        precioEfectivo: promo.precioEfectivo || promo.precioLista || 0,
        cantidad: 1,
        type: 'promo',
        originalItem: promo
      }];
    });
  };

  const removeFromCart = (itemId: string, type: 'product' | 'promo') => {
    setItems(prevItems => prevItems.filter(item => !(item.id === itemId && item.type === type)));
  };

  const undoLastItem = () => {
    setItems(prevItems => {
      if (prevItems.length === 0) return prevItems;
      const lastItem = prevItems[prevItems.length - 1];
      if (lastItem.cantidad > 1) {
        return [
          ...prevItems.slice(0, -1),
          { ...lastItem, cantidad: lastItem.cantidad - 1 }
        ];
      }
      return prevItems.slice(0, -1);
    });
  };

  const clearCart = () => setItems([]);

  const totalLista = items.reduce((sum, item) => sum + ((item.precioLista || 0) * item.cantidad), 0);
  const totalEfectivo = items.reduce((sum, item) => sum + ((item.precioEfectivo || 0) * item.cantidad), 0);

  return {
    items,
    addProductToCart,
    addPromoToCart,
    removeFromCart,
    undoLastItem,
    clearCart,
    totalLista,
    totalEfectivo
  };
};
