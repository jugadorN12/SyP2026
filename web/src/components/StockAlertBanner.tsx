import React from 'react';
import { StockAlert } from '../hooks/useAlerts';
import { AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StockAlertBannerProps {
  alerts: StockAlert[];
}

const StockAlertBanner: React.FC<StockAlertBannerProps> = ({ alerts }) => {
  const navigate = useNavigate();

  if (alerts.length === 0) return null;

  const criticalAlerts = alerts.filter(a => a.tipo === 'critico');
  const warningAlerts = alerts.filter(a => a.tipo === 'bajo');

  return (
    <div className="px-6 py-2 bg-slate-900 border-b border-slate-800 flex gap-4 overflow-x-auto no-scrollbar items-center animate-in slide-in-from-top duration-300">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Alertas Stock:</span>

      {criticalAlerts.map(alert => (
        <button
          key={alert.productId}
          onClick={() => navigate('/transfers')}
          className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full whitespace-nowrap group hover:bg-red-500/20 transition-all"
        >
          <AlertCircle size={14} className="text-red-500" />
          <span className="text-xs font-bold text-red-400">{alert.nombre} AGOTADO</span>
          <ArrowRight size={12} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}

      {warningAlerts.map(alert => (
        <button
          key={alert.productId}
          onClick={() => navigate('/transfers')}
          className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full whitespace-nowrap group hover:bg-amber-500/20 transition-all"
        >
          <AlertTriangle size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-amber-400">{alert.nombre} BAJO ({alert.cantidad})</span>
          <ArrowRight size={12} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}
    </div>
  );
};

export default StockAlertBanner;
