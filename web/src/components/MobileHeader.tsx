import React from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from '../hooks/useSidebar';
import { useAuth } from '../hooks/useAuth';

const MobileHeader: React.FC = () => {
  const { open } = useSidebar();
  const { user } = useAuth();

  if (!user || user.rol === 'cajero') return null;

  return (
    <div className="lg:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20 sticky top-0 w-full">
      <button
        onClick={open}
        className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
      >
        <Menu size={28} />
      </button>

      <h1 className="text-xl font-black text-primary-500 tracking-tighter">SyP</h1>

      <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-bold text-sm">
        {user.nombre.charAt(0)}
      </div>
    </div>
  );
};

export default MobileHeader;
