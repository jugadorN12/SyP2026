import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { CATEGORIES, Promo } from '../types/pos';
import ProductButton from '../components/ProductButton';
import CartaProductButton from '../components/CartaProductButton';
import CartSidebar from '../components/CartSidebar';
import StockAlertBanner from '../components/StockAlertBanner';
import CashClosureModal from '../components/CashClosureModal';
import PaymentModal from '../components/PaymentModal';
import CashMovementModal from '../components/CashMovementModal';
import OfflineStatus from '../components/OfflineStatus';
import NotificationCenter from '../components/NotificationCenter';
import { LogOut, User as UserIcon, ArrowLeftRight, Landmark, Tag, Wallet, BookOpen, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlerts } from '../hooks/useAlerts';
import { onSnapshot, collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatPrice } from '../utils/format';
import { useSession } from '../hooks/useSession';
import { useInventory } from '../hooks/useInventory';
import { useSectors } from '../hooks/useSectors';

const POSPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { products, loading: productsLoading } = useProducts();
  const { sectors, loading: sectorsLoading } = useSectors();
  const { inventory, loading: inventoryLoading } = useInventory(user?.sectorId);
  const { activeSession, loading: sessionLoading } = useSession(user?.sectorId);

  const {
    items,
    addProductToCart,
    addPromoToCart,
    totalLista,
    totalEfectivo,
    undoLastItem,
    clearCart
  } = useCart();

  // Merge products with sector inventory for display
  const sectorProducts = products.map(p => {
    const isManager = user?.rol !== 'cajero';
    // If it's a manager (General, Barra, Dueño), use the product's base stockActual (Global)
    if (isManager || user?.sectorId === 'global') return p;

    // Otherwise (it's a barman/cajero), look in the sector-specific inventory
    const inv = inventory.find(i => i.productId === p.id);
    return {
        ...p,
        stockActual: inv ? inv.stockActual : 0
    };
  });

  const { alerts } = useAlerts(sectorProducts);

  const [activeCategory, setActiveCategory] = useState('carta');
  const [showClosure, setShowClosure] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCashMovement, setShowCashMovement] = useState<'inicial' | 'retiro' | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);

  const [initialCash, setInitialCash] = useState<number | null>(null);
  const [totalEfectivoVentas, setTotalEfectivoVentas] = useState(0);
  const [totalDigitalVentas, setTotalDigitalVentas] = useState(0);
  const [totalRetiros, setTotalRetiros] = useState(0);

  // Mandatory check: Redirect to initial inventory if no session today
  useEffect(() => {
    if (!sessionLoading && !activeSession && user?.rol === 'cajero') {
      navigate('/pos/initial-check');
    }
  }, [activeSession, sessionLoading, user, navigate]);

  useEffect(() => {
    const unsubPromos = onSnapshot(collection(db, 'promos'), (snap: any) => {
      setPromos(snap.docs.map((d: any) => {
        const data = d.data();
        const pLista = data.precioLista !== undefined ? data.precioLista : (data.precioPromo || 0);
        const pEfectivo = data.precioEfectivo !== undefined ? data.precioEfectivo : pLista;
        return {
          id: d.id,
          ...data,
          precioLista: pLista,
          precioEfectivo: pEfectivo,
          esCarta: !!data.esCarta
        } as Promo;
      }));
    });

    const savedInitial = localStorage.getItem('syp_initial_cash');
    if (!savedInitial && !initialCash && user?.rol === 'cajero') {
      setShowCashMovement('inicial');
    } else if (savedInitial) {
      setInitialCash(parseFloat(savedInitial));
    }

    return () => unsubPromos();
  }, [initialCash]);

  const handleCheckout = async (montoEfectivo: number, montoDigital: number, metodo: string) => {
    try {
      const finalTotal = metodo === 'efectivo' ? totalEfectivo : totalLista;
      const batch = writeBatch(db);

      const saleRef = doc(collection(db, 'sales'));
      batch.set(saleRef, {
        cajeroId: user?.id,
        cajeroNombre: user?.nombre,
        timestamp: Date.now(),
        total: finalTotal,
        montoEfectivo,
        montoDigital,
        metodoPago: metodo,
        sectorId: user?.sectorId || 'unknown',
        items: items.map(i => ({
          id: i.id,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio: metodo === 'efectivo' ? i.precioEfectivo : i.precioLista,
          type: i.type
        }))
      });

      for (const item of items) {
        if (item.type === 'product') {
            const prodRef = doc(db, 'products', item.id);
            const globalStock = products.find(p => p.id === item.id)?.stockActual || 0;
            batch.update(prodRef, { stockActual: Math.max(0, globalStock - item.cantidad) });

            if (user?.sectorId && user.sectorId !== 'global') {
                const inventoryId = `${user.sectorId}_${item.id}`;
                const invRef = doc(db, 'inventory', inventoryId);
                const currentStock = sectorProducts.find(p => p.id === item.id)?.stockActual || 0;
                batch.update(invRef, { stockActual: Math.max(0, currentStock - item.cantidad) });
            }
        } else {
            // Promo: Deduct each product in promo
            const promo = item.originalItem as Promo;
            if (promo.productos) {
                for (const pItem of promo.productos) {
                    const prodRef = doc(db, 'products', pItem.id);
                    const pGlobalStock = products.find(p => p.id === pItem.id)?.stockActual || 0;
                    batch.update(prodRef, { stockActual: Math.max(0, pGlobalStock - (pItem.cantidad * item.cantidad)) });

                    if (user?.sectorId && user.sectorId !== 'global') {
                        const inventoryId = `${user.sectorId}_${pItem.id}`;
                        const invRef = doc(db, 'inventory', inventoryId);
                        const pCurrentStock = sectorProducts.find(p => p.id === pItem.id)?.stockActual || 0;
                        batch.update(invRef, { stockActual: Math.max(0, pCurrentStock - (pItem.cantidad * item.cantidad)) });
                    }
                }
            }
        }
      }

      await batch.commit();

      setTotalEfectivoVentas(prev => prev + montoEfectivo);
      setTotalDigitalVentas(prev => prev + montoDigital);

      setShowPayment(false);
      clearCart();
      alert('Venta finalizada con éxito');
    } catch (err) {
      console.error(err);
      alert('Error al registrar venta');
    }
  };

  const handleCashMovement = async (amount: number, _note: string) => {
    if (showCashMovement === 'inicial') {
      setInitialCash(amount);
      localStorage.setItem('syp_initial_cash', amount.toString());
    } else {
      setTotalRetiros(prev => prev + amount);
    }
    setShowCashMovement(null);
  };

  const expectedCash = (initialCash || 0) + totalEfectivoVentas - totalRetiros;

  const filteredProducts = sectorProducts.filter(p => p.categoria === activeCategory);
  const cartaProducts = sectorProducts.filter(p => p.esCarta);
  const cartaPromos = promos.filter(p => p.esCarta);

  const checkPromoStock = (promo: Promo) => {
    if (!promo.productos) return true;
    return promo.productos.every(pItem => {
      const product = sectorProducts.find(p => p.id === pItem.id);
      return product && product.stockActual >= pItem.cantidad;
    });
  };

  if (productsLoading || inventoryLoading || sessionLoading || sectorsLoading) {
    return <div className="h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div></div>;
  }

  // Get Sector Name from sectors list
  const currentSector = sectors.find(s => s.id === user?.sectorId);
  const sectorName = currentSector ? currentSector.nombre : (user?.sectorId === 'root' ? 'Admin' : 'Sin Barra');

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-white overflow-hidden relative">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black text-primary-500 tracking-tighter">SyP</h1>
            <div className="h-8 w-[1px] bg-slate-800 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 text-slate-400">
              <UserIcon size={18} />
              <span className="font-bold text-slate-200">{user?.nombre}</span>
              <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-500 uppercase tracking-widest ml-2">{sectorName}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <OfflineStatus />
            {user?.rol !== 'cajero' && <NotificationCenter />}
            <button onClick={() => navigate('/transfers')} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl border border-slate-800 transition-all">
              <ArrowLeftRight size={20} /><span className="text-xs font-black uppercase hidden lg:inline">Traspasos</span>
            </button>
            <button onClick={() => setShowCashMovement('retiro')} className="flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-500 rounded-xl border border-red-500/20 transition-all">
              <Wallet size={20} /><span className="text-xs font-black uppercase hidden lg:inline">Retiro</span>
            </button>
            <button onClick={() => setShowClosure(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-600/10 text-amber-500 rounded-xl border border-amber-500/20 transition-all">
              <Landmark size={20} /><span className="text-xs font-black uppercase hidden lg:inline">Cerrar Caja</span>
            </button>
            <button onClick={logout} className="p-3 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-2xl transition-all">
              <LogOut size={24} />
            </button>
          </div>
        </header>

        <StockAlertBanner alerts={alerts} />

        <div className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveCategory('carta')}
            className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCategory === 'carta' ? 'bg-white text-slate-950 shadow-xl ring-2 ring-white/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            <BookOpen size={18} /> CARTA
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id ? 'bg-slate-800 text-white shadow-lg ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {cat.nombre}
            </button>
          ))}

          <button
            onClick={() => setActiveCategory('promos')}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCategory === 'promos' ? 'bg-violet-600 text-white shadow-lg' : 'text-violet-500/60 hover:text-violet-400'
            }`}
          >
            <Tag size={16} /> Promos
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2 no-scrollbar">
          {productsLoading ? (
            <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div></div>
          ) : activeCategory === 'carta' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
               {cartaProducts.map(p => (
                 <CartaProductButton
                    key={p.id} item={p} type="product"
                    hasStock={p.stockActual > 0}
                    quantityInCart={items.find(i => i.id === p.id && i.type === 'product')?.cantidad || 0}
                    onClick={() => addProductToCart(p)}
                 />
               ))}
               {cartaPromos.map(p => (
                 <CartaProductButton
                    key={p.id} item={p} type="promo"
                    hasStock={checkPromoStock(p)}
                    quantityInCart={items.find(i => i.id === p.id && i.type === 'promo')?.cantidad || 0}
                    onClick={() => addPromoToCart(p)}
                 />
               ))}
               {cartaProducts.length === 0 && cartaPromos.length === 0 && (
                 <div className="col-span-full py-20 text-center bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
                   <p className="text-slate-600 font-bold italic">No hay productos marcados para la CARTA</p>
                 </div>
               )}
            </div>
          ) : activeCategory === 'promos' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {promos.map((promo) => {
                const hasStock = checkPromoStock(promo);
                const qtyInCart = items.find(i => i.id === promo.id && i.type === 'promo')?.cantidad || 0;
                return (
                  <button key={promo.id} disabled={!hasStock} onClick={() => addPromoToCart(promo)} className={`relative aspect-video rounded-[2rem] p-6 text-left transition-all ${hasStock ? 'bg-violet-100 text-violet-950 shadow-lg' : 'bg-slate-900 opacity-40 grayscale cursor-not-allowed'}`}>
                    {!hasStock && <Lock className="absolute top-6 right-6 text-slate-500" size={24} />}
                    {qtyInCart > 0 && <div className="absolute top-6 right-6 text-4xl font-black text-violet-600 opacity-40">{qtyInCart}</div>}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600/50 mb-2 block">PROMO</span>
                    <h3 className="text-xl font-black leading-tight mb-4 pr-12">{promo.nombre}</h3>
                    <div className="mt-auto flex justify-between items-end"><span className="text-2xl font-black font-mono">${formatPrice(promo.precioLista || 0)}</span></div>
                  </button>
                );
              })}
              {promos.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
                  <p className="text-slate-600 font-bold italic">No hay promociones creadas</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <ProductButton key={product.id} product={product} quantityInCart={items.find(i => i.id === product.id && i.type === 'product')?.cantidad || 0} onClick={() => addProductToCart(product)} />
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
                  <p className="text-slate-600 font-bold italic">No hay productos en esta categoría</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CartSidebar items={items} total={totalLista} onUndo={undoLastItem} onClear={clearCart} onCheckout={() => setShowPayment(true)} />

      {showPayment && <PaymentModal total={totalLista} totalEfectivo={totalEfectivo} onClose={() => setShowPayment(false)} onConfirm={handleCheckout} />}
      {showCashMovement && <CashMovementModal type={showCashMovement} onClose={() => setShowCashMovement(null)} onConfirm={handleCashMovement} />}
      {showClosure && (
        <CashClosureModal
          totalExpected={expectedCash}
          onClose={() => setShowClosure(false)}
          onConfirm={(declared) => { alert(`Caja cerrada. Diferencia: $${formatPrice(declared - expectedCash)}`); setShowClosure(false); localStorage.removeItem('syp_initial_cash'); setInitialCash(null); }}
          details={{ inicial: initialCash || 0, ventasEfectivo: totalEfectivoVentas, ventasDigital: totalDigitalVentas, retiros: totalRetiros }}
        />
      )}
    </div>
  );
};

export default POSPage;
