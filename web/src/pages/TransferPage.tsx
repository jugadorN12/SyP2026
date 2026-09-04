import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { Transfer, TransferStatus } from '../types/pos';
import TransferActionCard from '../components/TransferActionCard';
import TransferRequestModal from '../components/TransferRequestModal';
import { ArrowLeftRight, History, Plus } from 'lucide-react';

const DEMO_TRANSFERS: Transfer[] = [
  {
    id: 'tr-001',
    productoId: '1',
    productoNombre: 'Quilmes',
    sectorOrigenId: 'deposito_general',
    sectorDestinoId: 'barra_1',
    cantidadEnviada: 24,
    estado: 'pendiente',
    usuarioSolicitaId: 'cajero-1',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'tr-002',
    productoId: '4',
    productoNombre: 'Fernet c/ Coca',
    sectorOrigenId: 'deposito_general',
    sectorDestinoId: 'barra_1',
    cantidadEnviada: 12,
    estado: 'en_transito',
    usuarioSolicitaId: 'cajero-1',
    usuarioConfirmaSalidaId: 'admin-1',
    createdAt: Date.now() - 7200000,
    sentAt: Date.now() - 1800000
  }
];

const TransferPage: React.FC = () => {
  const { user } = useAuth();
  const { products } = useProducts();
  const [transfers, setTransfers] = useState<Transfer[]>(DEMO_TRANSFERS);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filter, setFilter] = useState<TransferStatus | 'all'>('all');

  const filteredTransfers = transfers.filter(t => filter === 'all' || t.estado === filter);

  const handleRequest = (productoId: string, cantidad: number, sectorOrigenId: string) => {
    const product = products.find(p => p.id === productoId);
    const newTransfer: Transfer = {
      id: `tr-${Math.random().toString(36).substr(2, 4)}`,
      productoId,
      productoNombre: product?.nombre || 'Producto',
      sectorOrigenId,
      sectorDestinoId: 'barra_1', // Current user's sector
      cantidadEnviada: cantidad,
      estado: 'pendiente',
      usuarioSolicitaId: user?.id || 'unknown',
      createdAt: Date.now()
    };
    setTransfers([newTransfer, ...transfers]);
    setShowRequestModal(false);
  };

  const handleConfirmExit = (id: string) => {
    setTransfers(prev => prev.map(t =>
      t.id === id ? { ...t, estado: 'en_transito', sentAt: Date.now(), usuarioConfirmaSalidaId: user?.id } : t
    ));
  };

  const handleConfirmEntry = (id: string, qty: number) => {
    setTransfers(prev => prev.map(t => {
      if (t.id === id) {
        const isDispute = qty !== t.cantidadEnviada;
        return {
          ...t,
          estado: isDispute ? 'en_disputa' : 'cerrado',
          cantidadRecibida: qty,
          receivedAt: Date.now(),
          usuarioConfirmaEntradaId: user?.id
        };
      }
      return t;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-500">
                <ArrowLeftRight size={24} />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Traspasos de Stock</h1>
            </div>
            <p className="text-slate-500">Gestión de mercadería entre barras y depósito</p>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 border border-slate-800 transition-all">
              <History size={20} />
              Historial
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex-1 md:flex-none px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-900/20 transition-all"
            >
              <Plus size={20} />
              Solicitar
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(['all', 'pendiente', 'en_transito', 'cerrado', 'en_disputa'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === s
                  ? 'bg-slate-800 text-white ring-1 ring-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Content */}
        {filteredTransfers.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800">
            <div className="text-4xl mb-4 opacity-20">📦</div>
            <p className="text-slate-500">No hay traspasos con este filtro</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTransfers.map((transfer) => (
              <TransferActionCard
                key={transfer.id}
                transfer={transfer}
                onConfirmExit={handleConfirmExit}
                onConfirmEntry={handleConfirmEntry}
                isOrigin={transfer.sectorOrigenId === 'deposito_general' || user?.rol === 'dueño'}
                isDestiny={transfer.sectorDestinoId === 'barra_1'}
              />
            ))}
          </div>
        )}
      </div>

      {showRequestModal && (
        <TransferRequestModal
          products={products}
          onClose={() => setShowRequestModal(false)}
          onRequest={handleRequest}
        />
      )}
    </div>
  );
};

export default TransferPage;
