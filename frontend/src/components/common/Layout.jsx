// src/components/common/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, Users, Wrench, Monitor,
  ClipboardList, LogOut, ChevronRight,
  Menu, User, Sun, Moon, MessageCircle, FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import logo from '../../assets/logo_taller.png';
import NotificacionesPanel from './NotificacionesPanel';
import ChatWidget from './ChatWidget';
import PWAInstallPrompt from './PWAInstallPrompt';


const NAV = {
  admin: [
    { to: '/admin',          label: 'Dashboard',  icon: LayoutDashboard, end: true },
    { to: '/admin/clientes', label: 'Clientes',   icon: Users },
    { to: '/admin/tecnicos', label: 'Técnicos',   icon: Wrench },
    { to: '/admin/equipos',  label: 'Equipos',    icon: Monitor },
    { to: '/admin/ordenes',  label: 'Órdenes',    icon: ClipboardList },
    { to: '/admin/chat',     label: 'Chat',        icon: MessageCircle },
    { to: '/admin/perfil',   label: 'Mi Perfil',  icon: User },
    { to: '/admin/presupuestos', label: 'Presupuestos', icon: FileText },

  ],
  tecnico: [
    { to: '/tecnico',        label: 'Mis Órdenes', icon: ClipboardList, end: true },
    { to: '/tecnico/perfil', label: 'Mi Perfil',   icon: User },
    
  ],
  cliente: [
    { to: '/cliente',         label: 'Mis Equipos', icon: Monitor,      end: true },
    { to: '/cliente/ordenes', label: 'Mis Órdenes', icon: ClipboardList },
    { to: '/cliente/presupuestos', label: 'Presupuestos', icon: FileText },

  ],
};

const ROL_BADGE = {
  admin:   { label: 'Administrador', color: '#06b6d4' },
  tecnico: { label: 'Técnico',       color: '#10b981' },
  cliente: { label: 'Cliente',       color: '#f59e0b' },
};

const MOBILE_BP = 1024;

export default function Layout() {
  const { user, logout }                = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate                        = useNavigate();
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [isMobile, setIsMobile]         = useState(window.innerWidth <= MOBILE_BP);

  const links   = NAV[user?.rol] || [];
  const rolInfo = ROL_BADGE[user?.rol] || {};

  useEffect(() => {
    const handle = () => {
      const mobile = window.innerWidth <= MOBILE_BP;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeMobile  = () => setMobileOpen(false);

  const showLabel        = isMobile || !collapsed;
  const sidebarW         = (!isMobile && collapsed) ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)';
  const mainML           = isMobile ? '0px' : collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)';
  const sidebarTranslate = isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Overlay móvil ── */}
      {isMobile && mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ════ SIDEBAR ════ */}
      <aside style={{
        position:      'fixed',
        top: 0, left: 0,
        height:        '100vh',
        width:         sidebarW,
        transform:     sidebarTranslate,
        zIndex:        50,
        background:    'var(--bg-secondary)',
        borderRight:   '1px solid var(--border)',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
        transition:    'width 0.25s ease, transform 0.25s ease',
        boxShadow:     (isMobile && mobileOpen) ? '6px 0 32px rgba(0,0,0,0.5)' : 'none',
      }}>

        {/* ── Logo ── */}
        <div style={{
          minHeight:      'var(--topbar-h)',
          padding:        '0 14px',
          borderBottom:   '1px solid var(--border)',
          display:        'flex',
          alignItems:     'center',
          gap:            '10px',
          justifyContent: showLabel ? 'space-between' : 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', minWidth: 0 }}>
            <img src={logo} alt="Logo" style={{
              width: '34px', height: '34px',
              objectFit: 'contain', flexShrink: 0, borderRadius: '8px',
            }} />
            {showLabel && (
              <span style={{
                fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                Taller Técnico
              </span>
            )}
          </div>
          {!isMobile && !collapsed && (
            <button onClick={() => setCollapsed(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', flexShrink: 0,
              padding: '4px', borderRadius: '6px', display: 'flex',
            }} title="Colapsar">
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Botón expandir cuando está colapsado */}
        {!isMobile && collapsed && (
          <button onClick={() => setCollapsed(false)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '10px',
            display: 'flex', justifyContent: 'center',
          }} title="Expandir">
            <Menu size={18} />
          </button>
        )}

        {/* ── Navegación ── */}
        <nav style={{
          flex: 1, padding: '10px 8px',
          display: 'flex', flexDirection: 'column', gap: '2px',
          overflowY: 'auto',
        }}>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              onClick={() => { if (isMobile) closeMobile(); }}
              style={({ isActive }) => ({
                display:        'flex',
                alignItems:     'center',
                gap:            '10px',
                padding:        showLabel ? '11px 12px' : '11px',
                borderRadius:   '8px',
                textDecoration: 'none',
                justifyContent: showLabel ? 'flex-start' : 'center',
                color:      isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(6,182,212,0.1)' : 'transparent',
                border:     isActive ? '1px solid rgba(6,182,212,0.2)' : '1px solid transparent',
                fontSize:   '14px',
                fontWeight: isActive ? '600' : '400',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              })}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {showLabel && label}
            </NavLink>
          ))}
        </nav>

        {/* ── Usuario + Logout ── */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
          {showLabel && (
            <div style={{
              padding: '10px 12px', borderRadius: '8px',
              background: 'var(--bg-hover)', marginBottom: '6px',
            }}>
              <div style={{
                fontSize: '13px', fontWeight: '600', marginBottom: '4px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.first_name} {user?.last_name}
              </div>
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
                fontWeight: '600',
                background: `${rolInfo.color}18`,
                color:      rolInfo.color,
                border:     `1px solid ${rolInfo.color}30`,
              }}>
                {rolInfo.label}
              </span>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: '8px',
            padding:        showLabel ? '11px 12px' : '11px',
            justifyContent: showLabel ? 'flex-start' : 'center',
            borderRadius: '8px', background: 'transparent', border: 'none',
            cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px',
            transition: 'color 0.15s', fontFamily: 'Space Grotesk, sans-serif',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut size={16} />
            {showLabel && 'Cerrar Sesión'}
          </button>
        </div>
      </aside>

      {/* ════ ÁREA PRINCIPAL ════ */}
      <div style={{
        flex:          1,
        marginLeft:    mainML,
        transition:    'margin-left 0.25s ease',
        display:       'flex',
        flexDirection: 'column',
        minHeight:     '100vh',
        minWidth:      0,
      }}>

        {/* ── Topbar ── */}
        <header style={{
          height:         'var(--topbar-h)',
          background:     'var(--bg-secondary)',
          borderBottom:   '1px solid var(--border)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0 20px',
          position:       'sticky',
          top:            0,
          zIndex:         30,
          gap:            '12px',
        }}>
          {/* Hamburger — solo móvil */}
          {isMobile && (
            <button onClick={() => setMobileOpen(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '6px',
              borderRadius: '8px', display: 'flex', flexShrink: 0,
              transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <Menu size={20} />
            </button>
          )}

          {/* Fecha */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '12px', color: 'var(--text-muted)',
              fontFamily: 'JetBrains Mono, monospace',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {new Date().toLocaleDateString('es-AR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </p>
          </div>

          {/* Acciones derechas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

            {/* Toggle tema */}
            <button onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo oscuro'} style={{
              background: 'var(--bg-hover)', border: '1px solid var(--border)',
              borderRadius: '9px', padding: '7px', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.15s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = isDark ? '#f59e0b' : '#8b5cf6';
                e.currentTarget.style.color = isDark ? '#f59e0b' : '#8b5cf6';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notificaciones */}
            <NotificacionesPanel />

            {/* Avatar */}
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${rolInfo.color}40, ${rolInfo.color}10)`,
              border: `1px solid ${rolInfo.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '700', color: rolInfo.color,
              flexShrink: 0, userSelect: 'none',
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
          </div>
        </header>

        {/* ── Contenido de página ── */}
        <main style={{
          flex: 1,
          padding: isMobile ? '16px 14px' : '28px 24px',
          overflowY: 'auto',
        }}>
          <Outlet />
        </main>
      </div>

      {/* ── Chat widget (solo clientes) ── */}
      {user?.rol === 'cliente' && <ChatWidget user={user} />}

      <style>{`
        @keyframes fadeIn    { from{opacity:0}to{opacity:1} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInDown{ from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
      `}</style>
        <PWAInstallPrompt />
    </div>
  );
}