// src/components/common/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, Users, Wrench, Monitor,
  ClipboardList, LogOut, ChevronLeft, ChevronRight,
  Menu, User, Sun, Moon, MessageCircle, FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import logo from '../../assets/logo_GY.png';
import NotificacionesPanel from './NotificacionesPanel';
import ChatWidget from './ChatWidget';
import PWAInstallPrompt from './PWAInstallPrompt';

const NAV = {
  admin: [
    { to: '/admin',           label: 'Dashboard',   icon: LayoutDashboard, end: true },
    { to: '/admin/clientes', label: 'Clientes',    icon: Users },
    { to: '/admin/tecnicos', label: 'Técnicos',    icon: Wrench },
    { to: '/admin/equipos',  label: 'Equipos',     icon: Monitor },
    { to: '/admin/ordenes',  label: 'Órdenes',     icon: ClipboardList },
    { to: '/admin/chat',     label: 'Chat',        icon: MessageCircle },
    { to: '/admin/perfil',   label: 'Mi Perfil',   icon: User },
    { to: '/admin/presupuestos', label: 'Presupuestos', icon: FileText },
  ],
  tecnico: [
    { to: '/tecnico',         label: 'Mis Órdenes', icon: ClipboardList, end: true },
    { to: '/tecnico/perfil', label: 'Mi Perfil',   icon: User },
  ],
  cliente: [
    { to: '/cliente',          label: 'Mis Equipos', icon: Monitor,      end: true },
    { to: '/cliente/ordenes', label: 'Mis Órdenes', icon: ClipboardList },
    { to: '/cliente/presupuestos', label: 'Presupuestos', icon: FileText },
  ],
};

const ROL_COLOR = {
  admin: '#06b6d4',
  tecnico: '#10b981',
  cliente: '#f59e0b',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = NAV[user?.rol] || [];
  const accentColor = ROL_COLOR[user?.rol] || '#06b6d4';

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Configuración de dimensiones
  const sidebarWidth = isMobile ? '280px' : (collapsed ? '80px' : '280px');
  const showLabels = !collapsed || isMobile;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* OVERLAY MÓVIL */}
      {isMobile && mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90, backdropFilter: 'blur(4px)' }} 
        />
      )}

      {/* SIDEBAR */}
      <aside style={{
        width: sidebarWidth,
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease, transform 0.3s ease',
        transform: isMobile && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
      }}>
        
        {/* SECCIÓN DEL LOGO GIGANTE */}
        <div style={{ 
          padding: showLabels ? '40px 20px' : '20px 10px', 
          textAlign: 'center',
          borderBottom: '1px solid var(--border)',
          position: 'relative'
        }}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{ 
              width: showLabels ? '240px' : '50px', 
              height: 'auto', 
              transition: 'all 0.3s ease',
              filter: isDark ? 'brightness(1.2)' : 'none'
            }} 
          />
          
          {/* Botón colapsar (solo Desktop) */}
          {!isMobile && (
            <button 
              onClick={() => setCollapsed(!collapsed)}
              style={{
                position: 'absolute', right: '-12px', top: '30px',
                width: '24px', height: '24px', borderRadius: '50%',
                background: accentColor, color: 'white', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}
        </div>

        {/* NAVEGACIÓN */}
        <nav style={{ flex: 1, padding: '20px 10px', overflowY: 'auto' }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => isMobile && setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 15px',
                marginBottom: '5px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: isActive ? 'white' : 'var(--text-secondary)',
                background: isActive ? accentColor : 'transparent',
                justifyContent: showLabels ? 'flex-start' : 'center',
                transition: '0.2s'
              })}
            >
              <link.icon size={20} />
              {showLabels && <span style={{ fontWeight: '600' }}>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* USUARIO Y LOGOUT */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
          {showLabels && (
            <div style={{ marginBottom: '15px', padding: '10px', background: 'var(--bg-hover)', borderRadius: '10px' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>{user?.first_name}</p>
              <p style={{ margin: 0, fontSize: '11px', color: accentColor, textTransform: 'uppercase' }}>{user?.rol}</p>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: showLabels ? 'flex-start' : 'center',
            gap: '10px', cursor: 'pointer', fontWeight: '600'
          }}>
            <LogOut size={18} />
            {showLabels && 'Cerrar Sesión'}
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ 
        flex: 1, 
        marginLeft: isMobile ? 0 : sidebarWidth, 
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* TOPBAR */}
        <header style={{
          height: '70px',
          padding: '0 25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 80
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {isMobile && (
              <button 
                onClick={() => setMobileOpen(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                <Menu size={24} />
              </button>
            )}
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={toggleTheme} 
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <NotificacionesPanel />
            <div style={{
              width: '35px', height: '35px', borderRadius: '50%', background: accentColor,
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
            }}>
              {user?.first_name?.[0]}
            </div>
          </div>
        </header>

        {/* ÁREA DE RENDERIZADO */}
        <main style={{ flex: 1, padding: isMobile ? '20px' : '30px' }}>
          <Outlet />
        </main>
      </div>

      {user?.rol === 'cliente' && <ChatWidget user={user} />}
      <PWAInstallPrompt />

      <style>{`
        body { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
      `}</style>
    </div>
  );
}