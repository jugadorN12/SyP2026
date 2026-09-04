import React, { useState } from 'react';
import { Transfer } from '../types/pos';
import { Package, ArrowRight, CheckCircle2, AlertTriangle, Truck } from 'lucide-react';

interface TransferActionCardProps {
  transfer: Transfer;
  onConfirmExit: (id: string) => void;
  onConfirmEntry: (id: string, qty: number) => void;
  isOrigin: boolean;
  isDestiny: boolean;
}

const TransferActionCard: React.FC<TransferActionCardProps> = ({
  transfer,
  onConfirmExit,
  onConfirmEntry,
  isOrigin,
  isDestiny
}) => {
  const [receivedQty, setReceivedQty] = useState(transfer.cantidadEnviada);

  const getStatusColor = () => {
    switch (transfer.estado) {
      case 'pendiente': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'en_transito': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'cerrado': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'en_disputa': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusIcon = () => {
    switch (transfer.estado) {
      case 'pendiente': return <Package size={16} />;
      case 'en_transito': return <Truck size={16} />;
      case 'cerrado': return <CheckCircle2 size={16} />;
      case 'en_disputa': return <AlertTriangle size={16} />;
      default: return null;
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 transition-all shadow-lg`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor()}`}>
          {getStatusIcon()}
          {transfer.estado.replace('_', ' ')}
        </div>
        <span className="text-xs text-slate-500 font-mono">
          #{transfer.id.slice(-4).toUpperCase()}
        </span>
      </div>

      <h3 className="text-xl font-bold text-white mb-1">{transfer.productoNombre}</h3>
      <div className="flex items-center gap-3 text-slate-400 text-sm mb-6">
        <span className="font-bold text-slate-200">{transfer.sectorOrigenId}</span>
        <ArrowRight size={14} />
        <span className="font-bold text-slate-200">{transfer.sectorDestinoId}</span>
      </div>

      <div className="bg-slate-950/50 rounded-2xl p-4 mb-6 border border-slate-800/50">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Cantidad Enviada</span>
          <span className="text-white font-black text-lg">{transfer.cantidadEnviada} uds.</span>
        </div>
        {transfer.estado === 'cerrado' && (
          <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-slate-800">
            <span className="text-slate-500">Cantidad Recibida</span>
            <span className="text-emerald-500 font-black text-lg">{transfer.cantidadRecibida} uds.</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {transfer.estado === 'pendiente' && isOrigin && (
        <button
          onClick={() => onConfirmExit(transfer.id)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20"
        >
          Confirmar Salida
        </button>
      )}

      {transfer.estado === 'en_transito' && isDestiny && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Recibido:</span>
            <input
              type="number"
              value={receivedQty}
              onChange={(e) => setReceivedQty(parseInt(e.target.value) || 0)}
              className="flex-1 bg-slate-800 border-none rounded-xl p-2 text-white text-center font-bold"
            />
          </div>
          <button
            onClick={() => onConfirmEntry(transfer.id, receivedQty)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20"
          >
            Confirmar Recepción
          </button>
        </div>
      )}
    </div>
  );
};

export default TransferActionCard;
