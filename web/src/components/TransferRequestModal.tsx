import React, { useState } from 'react';
import { Product } from '../types/pos';
import { X, Send } from 'lucide-react';

interface TransferRequestModalProps {
  products: Product[];
  onClose: () => void;
  onRequest: (productId: string, cantidad: number, sectorOrigenId: string) => void;
}

const TransferRequestModal: React.FC<TransferRequestModalProps> = ({ products, onClose, onRequest }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [sectorOrigen, setSectorOrigen] = useState('deposito_general');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProductId && cantidad > 0) {
      onRequest(selectedProductId, cantidad, sectorOrigen);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Solicitar Traspaso</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-2">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Producto</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-800 border-none rounded-xl p-4 text-white appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Selecciona un producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stockActual})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Cantidad</label>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-800 border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Origen</label>
              <select
                value={sectorOrigen}
                onChange={(e) => setSectorOrigen(e.target.value)}
                className="w-full bg-slate-800 border-none rounded-xl p-4 text-white appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500"
              >
                <option value="deposito_general">Depósito General</option>
                <option value="barra_2">Barra 2</option>
                <option value="barra_3">Barra 3</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary-900/20 flex items-center justify-center gap-2"
            >
              <Send size={20} />
              Enviar Solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferRequestModal;
