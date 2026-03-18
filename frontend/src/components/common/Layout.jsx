// src/components/common/Layout.jsx — Responsive v3
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Wrench, Monitor, ClipboardList,
  FileText, MessageCircle, LogOut, Sun, Moon, Menu, X,
  Bell, ChevronRight, User, Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificacionesPanel from './NotificacionesPanel';
import ChatWidget from './ChatWidget';
import PWAInstallPrompt from './PWAInstallPrompt';
import api from '../../api/axios';
import logo from '../../assets/logo_GY.png';

// ── Configuración de navegación ──────────────────────────
const NAV_ADMIN = [
  { to: '/admin',             label: 'Dashboard',      icon: LayoutDashboard, end: true },
  { to: '/admin/clientes',    label: 'Clientes',       icon: Users },
  { to: '/admin/tecnicos',    label: 'Técnicos',       icon: Wrench },
  { to: '/admin/equipos',     label: 'Equipos',        icon: Monitor },
  { to: '/admin/ordenes',     label: 'Órdenes',        icon: ClipboardList },
  { to: '/admin/presupuestos',label: 'Presupuestos',   icon: FileText },
  { to: '/admin/chat',        label: 'Chat',           icon: MessageCircle },
];

const NAV_TECNICO = [
  { to: '/tecnico',           label: 'Mis Órdenes',    icon: ClipboardList, end: true },
  { to: '/tecnico/perfil',    label: 'Mi Perfil',      icon: User },
];

const NAV_CLIENTE = [
  { to: '/cliente',               label: 'Mis Equipos',     icon: Monitor,       end: true },
  { to: '/cliente/ordenes',       label: 'Mis Órdenes',     icon: ClipboardList },
  { to: '/cliente/presupuestos',  label: 'Presupuestos',    icon: FileText },
];

const NAV_BY_ROL = { admin: NAV_ADMIN, tecnico: NAV_TECNICO, cliente: NAV_CLIENTE };

export default function Layout() {
  const { user, logout }    = useAuth();
  const { theme, toggle }   = useTheme();
  const navigate            = useNavigate();
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [noLeidas, setNoLeidas]         = useState(0);
  const [profileOpen, setProfileOpen]   = useState(false);

  const navItems = NAV_BY_ROL[user?.rol] || [];

  // Polling notificaciones
  useEffect(() => {
    const fetchNotif = async () => {
      try {
        const { data } = await api.get('/notificaciones/conteo/');
        setNoLeidas(data.no_leidas || 0);
      } catch {}
    };
    fetchNotif();
    const id = setInterval(fetchNotif, 30000);
    return () => clearInterval(id);
  }, []);

  // Cerrar sidebar en resize
  useEffect(() => {
    const handler = () => { if (window.innerWidth > 768) setSidebarOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Cerrar sidebar al navegar en mobile
  const handleNavClick = () => {
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const nombreUsuario = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || '';

  const iniciales = nombreUsuario.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>

      {/* ── Overlay mobile ──────────────────────────────── */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.15s ease',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══ SIDEBAR ════════════════════════════════════════ */}
      <aside style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: 'var(--sidebar-width)',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        // Mobile: oculto por defecto
        transform: sidebarOpen ? 'translateX(0)' : undefined,
      }}
        className="sidebar-aside"
      >
        {/* Logo */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logo} alt="Logo" style={{ height: '130px', width: 'AUTO', objectFit: 'contain' }} />
          </div>
          {/* Cerrar en mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'none', padding: '4px',
            }}
            className="sidebar-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={handleNavClick}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(6,182,212,0.1)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(6,182,212,0.2)' : 'transparent'}`,
                  transition: 'var(--transition)',
                })}
                onMouseEnter={e => {
                  if (!e.currentTarget.getAttribute('aria-current'))
                    e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={e => {
                  if (!e.currentTarget.getAttribute('aria-current'))
                    e.currentTarget.style.background = 'transparent';
                }}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={17} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isActive && <ChevronRight size={13} style={{ opacity: 0.5 }} />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer sidebar — perfil */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          {/* Rol badge */}
          <div style={{
            padding: '8px 12px', borderRadius: '8px',
            background: 'var(--bg-secondary)',
            marginBottom: '8px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'rgba(6,182,212,0.1)',
              border: '1px solid rgba(6,182,212,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '800', color: 'var(--accent-cyan)',
              flexShrink: 0,
            }}>
              {iniciales}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nombreUsuario}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.rol}
              </div>
            </div>
          </div>

          {/* Ir a perfil */}
          <NavLink
            to={`/${user?.rol}/perfil`}
            onClick={handleNavClick}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', color: 'var(--text-muted)', transition: 'var(--transition)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Settings size={15} /> Configuración
          </NavLink>

          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '9px 12px', borderRadius: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', color: 'var(--text-muted)',
            fontFamily: "'Space Grotesk', sans-serif",
            transition: 'var(--transition)',
            marginTop: '2px',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ══ CONTENIDO PRINCIPAL ════════════════════════════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 'var(--sidebar-width)',
        minWidth: 0,
        transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }} className="main-content">

        {/* ── Topbar ──────────────────────────────────────── */}
        <header style={{
          height: 'var(--topbar-height)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: '12px',
          backdropFilter: 'blur(8px)',
        }}>

          {/* Hamburger — solo mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="hamburger-btn"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'none',
              padding: '6px', borderRadius: '8px',
            }}
          >
            <Menu size={20} />
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Acciones topbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            {/* Theme toggle */}
            <button onClick={toggle} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '7px', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex',
              transition: 'var(--transition)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notificaciones */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setNotifOpen(o => !o)} style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '7px', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex',
                transition: 'var(--transition)',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <Bell size={16} />
                {noLeidas > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: '#ef4444', color: '#fff',
                    fontSize: '10px', fontWeight: '800',
                    borderRadius: '999px', minWidth: '17px', height: '17px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg-card)',
                  }}>
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>
              {notifOpen && (
                <NotificacionesPanel
                  onClose={() => setNotifOpen(false)}
                  onLeer={() => setNoLeidas(0)}
                />
              )}
            </div>

            {/* Avatar topbar (mobile) */}
            <div
              style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: '800', color: 'var(--accent-cyan)',
                cursor: 'pointer', flexShrink: 0,
              }}
              title={nombreUsuario}
            >
              {iniciales}
            </div>
          </div>
        </header>

        {/* ── Page content ──────────────────────────────── */}
        <main style={{
          flex: 1,
          padding: '24px',
          overflowX: 'hidden',
        }} className="page-main">
          <Outlet />
        </main>
      </div>

      {/* Chat widget (clientes) */}
      {user?.rol === 'cliente' && <ChatWidget user={user} />}

      {/* PWA prompt */}
      <PWAInstallPrompt />

      {/* ── Estilos responsive del layout ─────────────────── */}
      <style>{`
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }

        /* Desktop — sidebar visible */
        @media (min-width: 769px) {
          .sidebar-close-btn { display: none !important; }
          .sidebar-aside { transform: translateX(0) !important; }
          .hamburger-btn { display: none !important; }
        }

        /* Mobile — sidebar oculto, se muestra con hamburger */
        @media (max-width: 768px) {
          .sidebar-aside {
            transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            box-shadow: ${sidebarOpen ? 'var(--shadow-xl)' : 'none'};
          }
          .sidebar-close-btn { display: flex !important; }
          .hamburger-btn { display: flex !important; }
          .main-content { margin-left: 0 !important; }
          .page-main { padding: 16px !important; }
        }

        /* Tablet */
        @media (max-width: 1024px) and (min-width: 769px) {
          .page-main { padding: 20px !important; }
        }

        /* Large */
        @media (min-width: 1600px) {
          .page-main { padding: 32px !important; }
        }
      `}</style>
    </div>
  );
}