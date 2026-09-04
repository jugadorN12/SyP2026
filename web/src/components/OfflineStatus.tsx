import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const OfflineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${
      isOnline
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
        : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'
    }`}>
      {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
      <span className="text-[10px] font-black uppercase tracking-widest">
        {isOnline ? 'Sincronizado' : 'Modo Offline'}
      </span>
    </div>
  );
};

export default OfflineStatus;
