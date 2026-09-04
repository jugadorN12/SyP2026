import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import PinLoginPage from './pages/PinLoginPage';
import UserManagement from './pages/UserManagement';
import POSPage from './pages/POSPage';
import TransferPage from './pages/TransferPage';
import InventoryPage from './pages/InventoryPage';
import Dashboard from './pages/Dashboard';
import DeveloperConsole from './pages/DeveloperConsole';
import ProductManagement from './pages/ProductManagement';
import PromosPage from './pages/PromosPage';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import ErrorBoundary from './components/ErrorBoundary';
import { SidebarProvider } from './hooks/useSidebar';
import { UserRole } from './types/auth';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase/config';
import { hashPin } from './utils/security';

const Setup = () => {
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleSetup = async () => {
    setStatus('loading');
    try {
      const q = query(collection(db, 'users'), where('rol', '==', 'developer'));
      const snap = await getDocs(q);

      if (snap.empty) {
        console.log("Creando cuenta maestra...");
        await addDoc(collection(db, 'users'), {
          nombre: 'System Developer',
          rol: 'developer',
          pin: hashPin('0000'),
          activo: true,
          sectorId: 'root'
        });
        setStatus('success');
        alert('Developer account created with PIN 0000');
      } else {
        setStatus('success');
        alert('Developer account already exists');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Error desconocido');
      alert('Error: ' + (err.message || 'No se pudo conectar con Firebase'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 max-w-md w-full shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-6 italic">Inicializar Sistema</h1>
        <p className="text-slate-500 mb-8 text-sm">Esto creará la cuenta maestra de Developer si no existe.</p>

        {status === 'loading' ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            <p className="text-primary-500 font-bold animate-pulse">Conectando con Firestore...</p>
          </div>
        ) : (
          <button
            onClick={handleSetup}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-red-900/20 active:scale-95"
          >
            {status === 'success' ? 'Sistema Listo' : 'Crear Cuenta Developer'}
          </button>
        )}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-500 text-xs font-mono">{errorMsg}</p>
            <p className="text-slate-400 text-[10px] mt-2 italic">Asegúrate de que Firestore esté en "Test Mode" o tenga las reglas de escritura abiertas.</p>
          </div>
        )}

        {status === 'success' && (
          <p className="mt-6 text-emerald-500 font-bold">¡Cuenta creada! Ya puedes ir al <a href="/login/pin" className="underline">Login</a>.</p>
        )}
      </div>
    </div>
  );
};

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthorized } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>
  );

  if (!user) return <Navigate to="/login/pin" replace />;
  if (!isAuthorized(allowedRoles)) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SidebarProvider>
          <Router>
          <div className="flex h-screen bg-slate-950 overflow-hidden relative">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <MobileHeader />
              <div className="flex-1 overflow-y-auto">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/login/pin" element={<PinLoginPage />} />

                  {/* Protected Routes */}
                  <Route
                    path="/pos"
                    element={
                      <ProtectedRoute allowedRoles={['cajero', 'encargado_barra', 'encargado_boliche', 'dueño']}>
                        <POSPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transfers"
                    element={
                      <ProtectedRoute allowedRoles={['cajero', 'encargado_barra', 'encargado_boliche', 'dueño']}>
                        <TransferPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['encargado_boliche', 'dueño', 'developer']}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products"
                    element={
                      <ProtectedRoute allowedRoles={['dueño', 'encargado_boliche', 'developer']}>
                        <ProductManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/promos"
                    element={
                      <ProtectedRoute allowedRoles={['dueño', 'encargado_barra', 'encargado_boliche', 'developer']}>
                        <PromosPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute allowedRoles={['dueño', 'developer']}>
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="/" element={<Navigate to="/login/pin" replace />} />
                  <Route
                    path="/inventory"
                    element={
                      <ProtectedRoute allowedRoles={['encargado_barra', 'encargado_boliche', 'dueño', 'developer']}>
                        <InventoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dev-console"
                    element={
                      <ProtectedRoute allowedRoles={['developer']}>
                        <DeveloperConsole />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/setup" element={<Setup />} />
                  <Route path="/unauthorized" element={<div className="text-white p-8">No tienes permiso para ver esta sección.</div>} />
                </Routes>
              </div>
            </div>
          </div>
        </Router>
        </SidebarProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
