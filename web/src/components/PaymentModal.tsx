import React, { useState, useEffect } from 'react';
import { X, Banknote, QrCode, Split, CheckCircle2, TrendingDown } from 'lucide-react';
import { formatPrice } from '../utils/format';

interface PaymentModalProps {
  total: number;
  totalEfectivo: number;
  onClose: () => void;
  onConfirm: (montoEfectivo: number, montoDigital: number, metodo: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ total, totalEfectivo, onClose, onConfirm }) => {
  const [method, setMetodo] = useState<'efectivo' | 'digital' | 'mixto'>('efectivo');
  const [efectivo, setEfectivo] = useState<string>('');
  const [digital, setDigital] = useState<string>('');

  const currentTotal = method === 'efectivo' ? totalEfectivo : total;
  const savings = total - totalEfectivo;

  // Auto-calculate for Mixto
  useEffect(() => {
    if (method === 'mixto') {
      const numEfectivo = parseFloat(efectivo) || 0;
      if (numEfectivo <= total) {
        setDigital((total - numEfectivo).toFixed(2));
      } else {
        setDigital('0');
      }
    }
  }, [efectivo, method, total]);

  const handleConfirm = () => {
    if (method === 'efectivo') onConfirm(totalEfectivo, 0, 'efectivo');
    if (method === 'digital') onConfirm(0, total, 'digital');
    if (method === 'mixto') {
      onConfirm(parseFloat(efectivo) || 0, parseFloat(digital) || 0, 'mixto');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Confirmar Cobro</h2>
            <p className="text-slate-500 font-bold">A cobrar: <span className="text-primary-400 font-mono text-xl ml-2">${formatPrice(currentTotal)}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <button
            onClick={() => setMetodo('efectivo')}
            className={`relative flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border-2 transition-all ${
              method === 'efectivo' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 scale-105 shadow-lg' : 'bg-slate-800/50 border-transparent text-slate-500 grayscale'
            }`}
          >
            {savings > 0 && (
              <div className="absolute -top-3 -right-2 bg-emerald-500 text-black text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                <TrendingDown size={12}/> -${formatPrice(savings)}
              </div>
            )}
            <Banknote size={40} />
            <span className="font-black uppercase tracking-widest text-xs">Efectivo</span>
          </button>

          <button
            onClick={() => setMetodo('digital')}
            className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border-2 transition-all ${
              method === 'digital' ? 'bg-blue-500/10 border-blue-500 text-blue-500 scale-105 shadow-lg' : 'bg-slate-800/50 border-transparent text-slate-500 grayscale'
            }`}
          >
            <QrCode size={40} />
            <span className="font-black uppercase tracking-widest text-xs">QR / Transf.</span>
          </button>

          <button
            onClick={() => setMetodo('mixto')}
            className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border-2 transition-all ${
              method === 'mixto' ? 'bg-violet-500/10 border-violet-500 text-violet-500 scale-105 shadow-lg' : 'bg-slate-800/50 border-transparent text-slate-500 grayscale'
            }`}
          >
            <Split size={40} />
            <span className="font-black uppercase tracking-widest text-xs">Pago Mixto</span>
          </button>
        </div>

        {/* Info Alerts */}
        {method !== 'efectivo' && (
          <div className="mb-10 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-amber-500"></div>
             <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
               {method === 'mixto' ? 'Los pagos mixtos aplican precio de lista sin descuento.' : 'Los pagos digitales aplican precio de lista.'}
             </p>
          </div>
        )}

        {/* Mixto Detail Inputs */}
        {method === 'mixto' && (
          <div className="grid grid-cols-2 gap-8 mb-10 animate-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Efectivo ($)</label>
              <input
                autoFocus
                type="number"
                value={efectivo}
                onChange={e => setEfectivo(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border-b-2 border-emerald-500/30 focus:border-emerald-500 text-3xl font-black p-4 text-emerald-400 outline-none"
              />
              {efectivo && (
                <div className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest ml-1 animate-in fade-in duration-300">
                  Confirmación: ${formatPrice(parseFloat(efectivo) || 0)}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Restante QR ($)</label>
              <input
                type="number"
                value={digital}
                readOnly
                className="w-full bg-slate-950/50 border-b-2 border-blue-500/30 text-3xl font-black p-4 text-blue-400 outline-none cursor-default"
              />
              {digital && (
                <div className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest ml-1 animate-in fade-in duration-300">
                  Confirmación: ${formatPrice(parseFloat(digital) || 0)}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleConfirm}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black py-6 rounded-[1.5rem] transition-all shadow-xl shadow-primary-900/20 text-2xl uppercase tracking-[0.2em] active:scale-95 flex items-center justify-center gap-3"
        >
          <CheckCircle2 size={32} />
          Finalizar Venta
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;
