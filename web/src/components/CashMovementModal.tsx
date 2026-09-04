import React, { useState } from 'react';
import { X, Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { formatPrice } from '../utils/format';

interface CashMovementModalProps {
  type: 'inicial' | 'retiro';
  onClose: () => void;
  onConfirm: (amount: number, note: string) => void;
}

const CashMovementModal: React.FC<CashMovementModalProps> = ({ type, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const isInitial = type === 'inicial';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      onConfirm(numAmount, note || (isInitial ? 'Apertura de caja' : 'Retiro parcial'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isInitial ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              {isInitial ? <ArrowDownCircle size={28} /> : <ArrowUpCircle size={28} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                {isInitial ? 'Fondo de Caja' : 'Retiro de Efectivo'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {isInitial ? 'Ingresa el efectivo inicial para empezar' : 'Registra la salida de dinero del cajón'}
              </p>
            </div>
          </div>
          {!isInitial && (
            <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">
              <X size={24} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-3 block ml-1">monto en efectivo ($)</label>
            <div className="relative">
              <Wallet className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" size={24} />
              <input
                autoFocus
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={`w-full bg-slate-800 border-none rounded-[1.5rem] py-6 pl-16 pr-6 text-4xl font-black focus:ring-4 transition-all ${
                  isInitial ? 'focus:ring-emerald-500/20 text-emerald-400' : 'focus:ring-red-500/20 text-red-400'
                }`}
                required
              />
            </div>
            {amount && (
              <div className={`mt-4 p-4 rounded-2xl bg-black/20 border border-dashed flex justify-between items-center animate-in slide-in-from-top-2 duration-300 ${
                isInitial ? 'border-emerald-500/30' : 'border-red-500/30'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Formateado</span>
                <span className={`text-2xl font-black font-mono ${isInitial ? 'text-emerald-500' : 'text-red-500'}`}>
                  ${formatPrice(parseFloat(amount) || 0)}
                </span>
              </div>
            )}
          </div>

          {!isInitial && (
            <div>
              <label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-3 block ml-1">responsable / motivo</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej: Jose (Dueño)"
                className="w-full bg-slate-800 border-none rounded-2xl py-4 px-6 text-white font-bold focus:ring-2 focus:ring-slate-700"
                required={!isInitial}
              />
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-6 rounded-[1.5rem] font-black text-xl uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${
              isInitial
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20'
            }`}
          >
            {isInitial ? 'Abrir Caja' : 'Confirmar Retiro'}
          </button>
        </form>

        {isInitial && (
          <p className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
            * El fondo de caja es obligatorio para asegurar que el arqueo final sea correcto.
          </p>
        )}
      </div>
    </div>
  );
};

export default CashMovementModal;
