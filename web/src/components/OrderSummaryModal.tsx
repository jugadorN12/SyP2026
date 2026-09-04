import React, { useState } from 'react';
import { Product } from '../types/pos';
import { X, MessageCircle, Plus, Minus } from 'lucide-react';
import { generateWhatsAppLink, formatOrderMessage } from '../utils/whatsappUtils';

interface OrderItem {
  id: string;
  nombre: string;
  cantidad: number;
  proveedorTelefono: string;
}

interface OrderSummaryModalProps {
  lowStockProducts: Product[];
  onClose: () => void;
}

const OrderSummaryModal: React.FC<OrderSummaryModalProps> = ({ lowStockProducts, onClose }) => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>(
    lowStockProducts.map(p => ({
      id: p.id,
      nombre: p.nombre,
      cantidad: Math.max(p.stockMinimo * 2 - p.stockActual, 1),
      proveedorTelefono: p.proveedorTelefono || '5491100000000'
    }))
  );

  const updateQuantity = (id: string, delta: number) => {
    setOrderItems(prev => prev.map(item =>
      item.id === id ? { ...item, cantidad: Math.max(item.cantidad + delta, 1) } : item
    ));
  };

  const handleSendOrder = () => {
    // Group by provider if needed, for now we just take the first one or the most common
    // In a real app, we might want to send separate messages per provider
    const providers = Array.from(new Set(orderItems.map(i => i.proveedorTelefono)));

    providers.forEach(phone => {
      const itemsForProvider = orderItems.filter(i => i.proveedorTelefono === phone);
      const message = formatOrderMessage("SyP Boliche", itemsForProvider);
      const link = generateWhatsAppLink(phone, message);
      window.open(link, '_blank');
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Generar Pedido</h2>
            <p className="text-slate-500 text-sm">Revisa las cantidades antes de enviar a WhatsApp</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-2">
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4 mb-8 no-scrollbar">
          {orderItems.length === 0 ? (
            <p className="text-center py-10 text-slate-500 italic">No hay productos sugeridos para pedir.</p>
          ) : (
            orderItems.map((item) => (
              <div key={item.id} className="bg-slate-800/50 rounded-2xl p-4 flex items-center justify-between border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-white font-bold">{item.nombre}</span>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Prov: {item.proveedorTelefono}</span>
                </div>

                <div className="flex items-center gap-4 bg-slate-900 rounded-xl p-1 border border-slate-800">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-black text-primary-400">{item.cantidad}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-primary-500/5 rounded-3xl p-6 border border-primary-500/10 mb-8">
          <p className="text-xs text-primary-400 font-medium mb-1 uppercase tracking-widest">Resumen</p>
          <p className="text-slate-300 text-sm">Se generarán mensajes para {new Set(orderItems.map(i => i.proveedorTelefono)).size} proveedores con un total de {orderItems.reduce((a, b) => a + b.cantidad, 0)} unidades.</p>
        </div>

        <button
          onClick={handleSendOrder}
          disabled={orderItems.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <MessageCircle size={24} />
          Enviar Pedido por WhatsApp
        </button>
      </div>
    </div>
  );
};

export default OrderSummaryModal;
