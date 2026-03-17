// src/pages/admin/Perfil.jsx
// (también válido para técnico: src/pages/tecnico/Perfil.jsx)
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  User, Lock, Save, Eye, EyeOff, Camera,
  ClipboardList, CheckCircle, Clock, Sun, Moon,
  Mail, Phone, ShieldCheck, Calendar
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const AVATAR_COLORS = [
  ['#06b6d4','#0e7490'], ['#10b981','#047857'], ['#8b5cf6','#6d28d9'],
  ['#f59e0b','#b45309'], ['#ef4444','#b91c1c'], ['#ec4899','#be185d'],
];

export default function Perfil() {
  const { user, fetchMe } = useAuth();
  const { theme, toggle, isDark } = useTheme();
  const [tab, setTab]       = useState('datos');
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [stats, setStats]   = useState(null);

  const [datos, setDatos] = useState({
    first_name: user?.first_name ?? '',
    last_name:  user?.last_name  ?? '',
    email:      user?.email      ?? '',
    telefono:   user?.telefono   ?? '',
  });
  const [pass, setPass] = useState({
    password_actual: '', password_nuevo: '', password_nuevo2: '',
  });

  // Color de avatar según índice del usuario
  const colorIdx   = (user?.id ?? 0) % AVATAR_COLORS.length;
  const [c1, c2]   = AVATAR_COLORS[colorIdx];
  const initials   = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

  const ROL_LABELS = { admin: 'Administrador', tecnico: 'Técnico', cliente: 'Cliente' };
  const rolLabel   = ROL_LABELS[user?.rol] ?? user?.rol;

  // Cargar estadísticas del usuario
  useEffect(() => {
    const loadStats = async () => {
      try {
        if (user?.rol === 'admin') {
          const { data } = await api.get('/ordenes/estadisticas/');
          setStats({
            label1: 'Órdenes totales',  val1: data.total_ordenes,
            label2: 'En proceso',       val2: data.en_proceso,
            label3: 'Cobrado total',    val3: `$${(data.total_cobrado ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
          });
        } else if (user?.rol === 'tecnico') {
          const { data } = await api.get('/ordenes/');
          const list = data.results ?? data;
          setStats({
            label1: 'Asignadas',  val1: list.length,
            label2: 'En proceso', val2: list.filter(o => ['diagnostico','en_reparacion','esperando_repuesto'].includes(o.estado)).length,
            label3: 'Completadas',val3: list.filter(o => ['listo','entregado'].includes(o.estado)).length,
          });
        }
      } catch { /* silencioso */ }
    };
    loadStats();
  }, [user]);

  const saveDatos = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.patch(`/auth/usuarios/${user.id}/`, datos);
      await fetchMe();
      toast.success('Datos actualizados correctamente');
    } catch { toast.error('Error al guardar los datos'); }
    finally { setSaving(false); }
  };

  const savePass = async (e) => {
    e.preventDefault();
    if (pass.password_nuevo !== pass.password_nuevo2) {
      toast.error('Las contraseñas nuevas no coinciden'); return;
    }
    if (pass.password_nuevo.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres'); return;
    }
    setSaving(true);
    try {
      await api.post('/auth/usuarios/cambiar_password/', pass);
      toast.success('Contraseña actualizada');
      setPass({ password_actual: '', password_nuevo: '', password_nuevo2: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar contraseña');
    } finally { setSaving(false); }
  };

  const tabStyle = (t) => ({
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
    fontSize: '13px', fontWeight: '500', transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', gap: '6px',
    background: tab === t ? 'rgba(6,182,212,0.12)' : 'transparent',
    color:      tab === t ? '#06b6d4' : 'var(--text-secondary)',
    borderBottom: tab === t ? '2px solid var(--accent-cyan)' : '2px solid transparent',
  });

  return (
    <div style={{ maxWidth: '660px', animation: 'fadeInUp 0.4s ease' }}>

      {/* ── Encabezado ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Mi Perfil</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          Configuración de cuenta y preferencias
        </p>
      </div>

      {/* ── Hero card con avatar ── */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${c1}, ${c2})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: '800', color: '#fff',
              boxShadow: `0 0 0 3px var(--bg-card), 0 0 0 5px ${c1}50`,
              userSelect: 'none',
            }}>
              {initials || <User size={28} />}
            </div>
            {/* Badge online */}
            <span style={{
              position: 'absolute', bottom: '3px', right: '3px',
              width: '12px', height: '12px', borderRadius: '50%',
              background: '#10b981', border: '2px solid var(--bg-card)',
            }} title="En línea" />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
              {user?.first_name} {user?.last_name}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: '999px',
                background: `${c1}20`, color: c1, border: `1px solid ${c1}35`,
                fontWeight: '600',
              }}>
                {rolLabel}
              </span>
              <span style={{
                fontSize: '11px', color: 'var(--text-muted)',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                @{user?.username}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              {user?.email && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Mail size={11} /> {user.email}
                </span>
              )}
              {user?.telefono && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Phone size={11} /> {user.telefono}
                </span>
              )}
              {user?.fecha_registro && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Calendar size={11} /> Desde {new Date(user.fecha_registro).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          {/* Toggle tema — aquí en el hero */}
          <button
            onClick={toggle}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{
              display:      'flex', alignItems: 'center', gap: '8px',
              padding:      '9px 14px', borderRadius: '10px',
              border:       '1px solid var(--border)',
              background:   'var(--bg-hover)',
              cursor:       'pointer', transition: 'all 0.2s',
              color:        'var(--text-secondary)',
              fontFamily:   'Space Grotesk, sans-serif',
              fontSize:     '13px', fontWeight: '500',
              flexShrink:   0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {isDark
              ? <><Sun size={15} color="#f59e0b" /> Modo claro</>
              : <><Moon size={15} color="#8b5cf6" /> Modo oscuro</>
            }
          </button>
        </div>

        {/* Stats (si aplica) */}
        {stats && (
          <div style={{
            marginTop: '20px', paddingTop: '18px',
            borderTop: '1px solid var(--border)',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
          }}>
            {[
              { label: stats.label1, val: stats.val1, icon: ClipboardList, color: '#06b6d4' },
              { label: stats.label2, val: stats.val2, icon: Clock,         color: '#f59e0b' },
              { label: stats.label3, val: stats.val3, icon: CheckCircle,   color: '#10b981' },
            ].map(({ label, val, icon: Icon, color }) => (
              <div key={label} style={{
                textAlign: 'center', padding: '12px 8px', borderRadius: '10px',
                background: `${color}08`, border: `1px solid ${color}20`,
              }}>
                <Icon size={16} color={color} style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '20px', fontWeight: '800', color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                  {val ?? '—'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: '2px', marginBottom: '16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <button style={tabStyle('datos')} onClick={() => setTab('datos')}>
          <User size={13} /> Datos personales
        </button>
        <button style={tabStyle('pass')} onClick={() => setTab('pass')}>
          <Lock size={13} /> Contraseña
        </button>
        <button style={tabStyle('tema')} onClick={() => setTab('tema')}>
          {isDark ? <Moon size={13} /> : <Sun size={13} />} Apariencia
        </button>
      </div>

      {/* ── Tab: Datos personales ── */}
      {tab === 'datos' && (
        <div className="card" style={{ padding: '24px' }}>
          <form onSubmit={saveDatos}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px' }}>Nombre</label>
                  <input className="input-field" value={datos.first_name}
                    onChange={e => setDatos({ ...datos, first_name: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px' }}>Apellido</label>
                  <input className="input-field" value={datos.last_name}
                    onChange={e => setDatos({ ...datos, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Email</label>
                <input className="input-field" type="email" value={datos.email}
                  onChange={e => setDatos({ ...datos, email: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Teléfono</label>
                <input className="input-field" value={datos.telefono}
                  placeholder="3884000000"
                  onChange={e => setDatos({ ...datos, telefono: e.target.value })} />
              </div>
              {/* Campo de solo lectura */}
              <div style={{
                padding: '12px 14px', borderRadius: '8px',
                background: 'var(--bg-hover)', border: '1px solid var(--border)',
                display: 'flex', gap: '10px', alignItems: 'center',
              }}>
                <ShieldCheck size={15} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Nombre de usuario</div>
                  <div style={{ fontSize: '14px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
                    @{user?.username}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saving
                    ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Guardando...</>
                    : <><Save size={14} /> Guardar cambios</>
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab: Contraseña ── */}
      {tab === 'pass' && (
        <div className="card" style={{ padding: '24px' }}>
          <form onSubmit={savePass}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Contraseña actual</label>
                <div suppressHydrationWarning style={{ position: 'relative' }}>
                  <input className="input-field"
                    type={showPass ? 'text' : 'password'}
                    value={pass.password_actual}
                    onChange={e => setPass({ ...pass, password_actual: e.target.value })}
                    style={{ paddingRight: '44px' }} required />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px' }}>Nueva contraseña</label>
                  <input className="input-field" type="password" value={pass.password_nuevo}
                    onChange={e => setPass({ ...pass, password_nuevo: e.target.value })}
                    placeholder="mín. 8 caracteres" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px' }}>Confirmar nueva</label>
                  <input className="input-field" type="password" value={pass.password_nuevo2}
                    onChange={e => setPass({ ...pass, password_nuevo2: e.target.value })}
                    placeholder="repetí la contraseña" required />
                </div>
              </div>
              {/* Indicador fortaleza */}
              {pass.password_nuevo && (
                <PasswordStrength password={pass.password_nuevo} />
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saving
                    ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Cambiando...</>
                    : <><Lock size={14} /> Cambiar contraseña</>
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab: Apariencia ── */}
      {tab === 'tema' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Tema de la interfaz
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <ThemeOption
              active={isDark}
              icon={<Moon size={22} color="#8b5cf6" />}
              label="Modo oscuro"
              desc="Interfaz dark, ideal para trabajar de noche"
              color="#8b5cf6"
              onClick={() => { if (!isDark) toggle(); }}
            />
            <ThemeOption
              active={!isDark}
              icon={<Sun size={22} color="#f59e0b" />}
              label="Modo claro"
              desc="Interfaz clara, ideal para ambientes con luz"
              color="#f59e0b"
              onClick={() => { if (isDark) toggle(); }}
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '14px', textAlign: 'center' }}>
            La preferencia se guarda automáticamente en este dispositivo.
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @media (max-width: 480px) {
          .perfil-stats { grid-template-columns: 1fr 1fr !important; }
          .perfil-grid2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── Indicador fortaleza contraseña ─────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: 'Mín. 8 caracteres', ok: password.length >= 8 },
    { label: 'Letras mayúsculas',  ok: /[A-Z]/.test(password) },
    { label: 'Números',            ok: /[0-9]/.test(password) },
    { label: 'Caracteres especiales', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score  = checks.filter(c => c.ok).length;
  const colors = ['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];
  const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const color  = colors[score];

  return (
    <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fortaleza</span>
        <span style={{ fontSize: '12px', fontWeight: '600', color }}>{labels[score]}</span>
      </div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: '2px',
            background: i < score ? color : 'var(--bg-hover)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {checks.map(c => (
          <span key={c.label} style={{
            fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
            background: c.ok ? 'rgba(16,185,129,0.1)' : 'var(--bg-hover)',
            color: c.ok ? '#10b981' : 'var(--text-muted)',
            border: `1px solid ${c.ok ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
          }}>
            {c.ok ? '✓' : '·'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Opción de tema ─────────────────────────────────────
function ThemeOption({ active, icon, label, desc, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding:      '18px',
        borderRadius: '12px',
        border:       `2px solid ${active ? color : 'var(--border)'}`,
        background:   active ? `${color}08` : 'var(--bg-hover)',
        cursor:       active ? 'default' : 'pointer',
        transition:   'all 0.2s',
        textAlign:    'center',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = `${color}70`; e.currentTarget.style.background = `${color}06`; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-hover)'; } }}
    >
      <div style={{ marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: active ? color : 'var(--text-primary)' }}>
        {label}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{desc}</div>
      {active && (
        <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: '600', color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <CheckCircle size={11} /> Activo
        </div>
      )}
    </div>
  );
}