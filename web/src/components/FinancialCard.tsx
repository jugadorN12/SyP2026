import React from 'react';

interface FinancialCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isUp: boolean;
  };
  color: 'primary' | 'emerald' | 'amber' | 'blue';
}

const FinancialCard: React.FC<FinancialCardProps> = ({ title, value, subtitle, icon, trend, color }) => {
  const colorMap = {
    primary: 'text-primary-500 bg-primary-500/10 border-primary-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl border ${colorMap[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
            trend.isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
          }`}>
            {trend.isUp ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-white font-mono">{value}</h3>
        <p className="text-slate-600 text-[10px] font-medium">{subtitle}</p>
      </div>
    </div>
  );
};

export default FinancialCard;
