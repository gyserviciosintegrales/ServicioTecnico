import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';

import Login          from './pages/Login';
import Register       from './pages/Register';
import Unauthorized   from './pages/Unauthorized';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import IngresoCliente from './pages/IngresoCliente';

import AdminDashboard    from './pages/admin/Dashboard';
import AdminClientes     from './pages/admin/Clientes';
import AdminTecnicos     from './pages/admin/Tecnicos';
import AdminEquipos      from './pages/admin/Equipos';
import AdminOrdenes      from './pages/admin/Ordenes';
import AdminPerfil       from './pages/admin/Perfil';
import AdminChat         from './pages/admin/ChatPanel';
import AdminPresupuestos from './pages/admin/Presupuestos';

import TecnicoOrdenes from './pages/tecnico/MisOrdenes';
import TecnicoPerfil  from './pages/tecnico/Perfil';

import ClienteEquipos      from './pages/cliente/MisEquipos';
import ClienteOrdenes      from './pages/cliente/MisOrdenes';
import ClientePresupuestos from './pages/cliente/MisPresupuestos';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>

          {/* ── Rutas públicas ── */}
          <Route path="/login"                  element={<Login />} />
          <Route path="/register"               element={<Register />} />
          <Route path="/unauthorized"           element={<Unauthorized />} />
          <Route path="/forgot-password"        element={<ForgotPassword />} />
          <Route path="/reset-password/:token"  element={<ResetPassword />} />
          <Route path="/ingreso-cliente"        element={<IngresoCliente />} />
          <Route path="/"                       element={<Navigate to="/login" replace />} />

          {/* ── Admin ── */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <ErrorBoundary>
                <Layout />
              </ErrorBoundary>
            </ProtectedRoute>
          }>
            <Route index                  element={<AdminDashboard />} />
            <Route path="clientes"        element={<AdminClientes />} />
            <Route path="tecnicos"        element={<AdminTecnicos />} />
            <Route path="equipos"         element={<AdminEquipos />} />
            <Route path="ordenes"         element={<AdminOrdenes />} />
            <Route path="perfil"          element={<AdminPerfil />} />
            <Route path="chat"            element={<AdminChat />} />
            <Route path="presupuestos"    element={<AdminPresupuestos />} />
          </Route>

          {/* ── Técnico ── */}
          <Route path="/tecnico" element={
            <ProtectedRoute roles={['tecnico']}>
              <ErrorBoundary>
                <Layout />
              </ErrorBoundary>
            </ProtectedRoute>
          }>
            <Route index         element={<TecnicoOrdenes />} />
            <Route path="perfil" element={<TecnicoPerfil />} />
          </Route>

          {/* ── Cliente ── */}
          <Route path="/cliente" element={
            <ProtectedRoute roles={['cliente']}>
              <ErrorBoundary>
                <Layout />
              </ErrorBoundary>
            </ProtectedRoute>
          }>
            <Route index                element={<ClienteEquipos />} />
            <Route path="ordenes"       element={<ClienteOrdenes />} />
            <Route path="presupuestos"  element={<ClientePresupuestos />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;