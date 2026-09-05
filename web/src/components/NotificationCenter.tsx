import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Bell, X, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user || user.rol === 'cajero') return;

    const q = query(
      collection(db, 'notifications'),
      where('leida', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snap: any) => {
      setNotifications(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { leida: true });
  };

  if (!user || user.rol === 'cajero') return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors bg-slate-900 rounded-xl border border-slate-800"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full animate-pulse">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Notificaciones</h3>
            <button onClick={() => setIsOpen(false)}><X size={16}/></button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-slate-600 text-xs italic">No hay alertas nuevas</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                  <div className="flex justify-between items-start gap-3">
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">{n.mensaje}</p>
                    <button
                        onClick={() => markAsRead(n.id)}
                        className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Check size={12} />
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-2 uppercase font-black">
                    {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString() : 'Ahora'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
