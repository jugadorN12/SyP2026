import React, { useState } from 'react';
import { X, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../utils/format';

interface CashClosureModalProps {
  totalExpected: number;
  onClose: () => void;
  onConfirm: (declared: number) => void;
  details: {
    inicial: number;
    ventasEfectivo: number;
    ventasDigital: number;
    retiros: number;
  };
}

const CashClosureModal: React.FC<CashClosureModalProps> = ({ totalExpected, onClose, onConfirm, details }) => {
  const [declared, setDeclared] = useState<string>('');
  const diff = (parseFloat(declared) || 0) - totalExpected;
  const isPerfect = diff === 0;
  const isNegative = diff < 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-white italic">Arqueo de Caja</h2>
            <p className="text-slate-500 text-sm font-medium">Declara el efectivo recaudado</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-2">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-950/50 rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>(+) Fondo Inicial</span>
              <span>${formatPrice(details.inicial)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>(+) Ventas Efectivo</span>
              <span>${formatPrice(details.ventasEfectivo)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-blue-400/70">
              <span>(i) Ventas Digital/QR</span>
              <span>${formatPrice(details.ventasDigital)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-red-500/70">
              <span>(-) Retiros Realizados</span>
              <span>${formatPrice(details.retiros)}</span>
            </div>
            <div className="h-[1px] bg-slate-800 w-full"></div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Monto a Entregar</span>
              <span className="text-3xl font-black text-white font-mono">${formatPrice(totalExpected)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase font-black tracking-widest mb-2 ml-1">Monto Físico (Caja)</label>
            <div className="relative">
              <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" size={20} />
              <input
                type="number"
                value={declared}
                onChange={(e) => setDeclared(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-800 border-none rounded-2xl py-5 pl-12 pr-4 text-white text-2xl font-black focus:ring-2 focus:ring-primary-500 placeholder-slate-700"
              />
            </div>
            {declared !== '' && (
              <div className="text-[10px] font-black text-primary-500/50 uppercase tracking-widest mt-2 ml-1 animate-in fade-in duration-300">
                Confirmación: ${formatPrice(parseFloat(declared) || 0)}
              </div>
            )}
          </div>

          {declared !== '' && (
            <div className={`p-6 rounded-3xl border animate-in slide-in-from-bottom-4 duration-300 ${
              isPerfect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
              isNegative ? 'bg-red-500/10 border-red-500/20 text-red-500' :
              'bg-blue-500/10 border-blue-500/20 text-blue-500'
            }`}>
              <div className="flex items-center gap-3 mb-1">
                {isPerfect ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span className="text-sm font-black uppercase tracking-widest">
                  {isPerfect ? 'Caja Cuadrada' : isNegative ? 'Faltante en Caja' : 'Sobrante en Caja'}
                </span>
              </div>
              <p className="text-3xl font-black font-mono">
                {isNegative ? '-' : '+'}${formatPrice(Math.abs(diff))}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => onConfirm(parseFloat(declared) || 0)}
          disabled={declared === ''}
          className="w-full mt-8 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-primary-900/20 flex items-center justify-center gap-2"
        >
          Confirmar y Cerrar Caja
        </button>
      </div>
    </div>
  );
};

export default CashClosureModal;
