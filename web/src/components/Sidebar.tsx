import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSidebar } from '../hooks/useSidebar';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  ArrowLeftRight,
  LogOut,
  ChevronRight,
  PlusCircle,
  Tag,
  Shield,
  LayoutTemplate,
  Activity,
  X
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOpen, close } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || user.rol === 'cajero') return null;

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['dueño', 'encargado_boliche', 'developer'] },
    { name: 'Ventas (POS)', icon: <ShoppingCart size={20} />, path: '/pos', roles: ['dueño', 'encargado_barra', 'encargado_boliche', 'developer'] },
    { name: 'Monitor Real-Time', icon: <Activity size={20} />, path: '/monitor', roles: ['dueño', 'encargado_barra', 'encargado_boliche', 'developer'] },
    { name: 'Inventario', icon: <Package size={20} />, path: '/inventory', roles: ['dueño', 'encargado_barra', 'encargado_boliche', 'developer'] },
    { name: 'Gestión de Barras', icon: <LayoutTemplate size={20} />, path: '/sectors', roles: ['dueño', 'encargado_barra', 'encargado_boliche', 'developer'] },
    { name: 'Cargar Producto', icon: <PlusCircle size={20} />, path: '/products', roles: ['dueño', 'encargado_boliche', 'developer'] },
    { name: 'Gestionar Promos', icon: <Tag size={20} />, path: '/promos', roles: ['dueño', 'encargado_barra', 'encargado_boliche', 'developer'] },
    { name: 'Traspasos', icon: <ArrowLeftRight size={20} />, path: '/transfers', roles: ['dueño', 'encargado_barra', 'encargado_boliche', 'developer'] },
    { name: 'Personal', icon: <Users size={20} />, path: '/users', roles: ['dueño', 'developer'] },
    { name: 'Dev Console', icon: <Shield size={20} />, path: '/dev-console', roles: ['developer'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(user.rol));

  const handleNavigate = (path: string) => {
    navigate(path);
    close();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-primary-500 tracking-tighter">SyP</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Admin Panel</p>
          </div>
          <button onClick={close} className="lg:hidden text-slate-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          {allowedItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-bold text-sm">{item.name}</span>
                </div>
                {isActive && <ChevronRight size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-950/50 rounded-3xl p-4 mb-4 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-bold text-xs">
                {user.nombre.charAt(0)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-white truncate">{user.nombre}</span>
                <span className="text-[10px] text-slate-500 uppercase font-black truncate">{user.rol.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 p-4 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-bold text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
