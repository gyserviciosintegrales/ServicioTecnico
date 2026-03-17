import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const redirects = { admin: '/admin', tecnico: '/tecnico', cliente: '/cliente' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <ShieldOff size={28} color="#ef4444" />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Acceso Denegado</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          No tenés permisos para ver esta página.
        </p>
        <button className="btn-primary" onClick={() => navigate(redirects[user?.rol] || '/login')}>
          Ir a mi panel
        </button>
      </div>
    </div>
  );
}