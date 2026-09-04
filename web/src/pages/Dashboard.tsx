import React from 'react';
import { useReports } from '../hooks/useReports';
import FinancialCard from '../components/FinancialCard';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { DollarSign, TrendingUp, ShoppingBag, Percent, Calendar } from 'lucide-react';
import { formatPrice } from '../utils/format';

const Dashboard: React.FC = () => {
  const { metrics, salesByHour } = useReports();

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-3xl font-black mb-1 flex items-center gap-3 italic">
              Dashboard Financiero
            </h1>
            <p className="text-slate-500 text-xs md:text-sm">Resumen de operaciones en tiempo real</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 md:px-6 md:py-3 flex items-center gap-3 w-full md:w-auto">
            <Calendar className="text-primary-500" size={18} />
            <span className="font-bold text-slate-200 text-sm md:text-base">Hoy: {new Date().toLocaleDateString()}</span>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <FinancialCard
            title="Ingresos Brutos"
            value={`$${formatPrice(metrics.totalIngresos)}`}
            subtitle="Total vendido hoy"
            icon={<DollarSign size={24} />}
            color="primary"
            trend={{ value: '12%', isUp: true }}
          />
          <FinancialCard
            title="Utilidad Neta"
            value={`$${formatPrice(metrics.totalUtilidad)}`}
            subtitle="Ganancia estimada"
            icon={<TrendingUp size={24} />}
            color="emerald"
            trend={{ value: '8%', isUp: true }}
          />
          <FinancialCard
            title="Ventas Totales"
            value={metrics.totalVentas.toString()}
            subtitle="Tickets emitidos"
            icon={<ShoppingBag size={24} />}
            color="blue"
          />
          <FinancialCard
            title="Margen Promedio"
            value={`${metrics.margenPromedio.toFixed(1)}%`}
            subtitle="Rendimiento de stock"
            icon={<Percent size={24} />}
            color="amber"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales By Hour */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <span className="w-2 h-6 bg-primary-500 rounded-full"></span>
              Ventas por Hora
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesByHour}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${formatPrice(value)}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#0ea5e9"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Categories or other metric */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              Distribución de Cobros
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={salesByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{fill: '#1e293b', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[10, 10, 10, 10]} barSize={20} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
            Ranking de Productos (Demo)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase tracking-[0.2em] border-b border-slate-800">
                  <th className="pb-4 font-black">Producto</th>
                  <th className="pb-4 font-black">Ventas</th>
                  <th className="pb-4 font-black">Ingresos</th>
                  <th className="pb-4 font-black">Utilidad</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { name: 'Quilmes', qty: 156, revenue: 390000, profit: 210000 },
                  { name: 'Fernet c/ Coca', qty: 89, revenue: 400500, profit: 222500 },
                  { name: 'Gin tonic', qty: 45, revenue: 225000, profit: 126000 },
                  { name: 'Corona', qty: 32, revenue: 102400, profit: 44800 },
                ].map((item, i) => (
                  <tr key={i} className="border-b border-slate-800/50 group hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-slate-200">{item.name}</td>
                    <td className="py-4 font-mono text-primary-400">{item.qty} uds.</td>
                    <td className="py-4 font-mono text-slate-300">${formatPrice(item.revenue)}</td>
                    <td className="py-4 font-mono text-emerald-500">+${formatPrice(item.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-600 text-xs">
          Actualizado cada 60 segundos automáticamente • SyP Boliche Intelligence 2026
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
