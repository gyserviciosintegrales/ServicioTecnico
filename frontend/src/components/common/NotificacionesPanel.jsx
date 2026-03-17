// src/components/common/NotificacionesPanel.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck, Clock, Package, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

const TIPO_CONFIG = {
  orden_nueva:     { icon: '🆕', color: '#06b6d4' },
  estado_cambio:   { icon: '🔄', color: '#8b5cf6' },
  orden_asignada:  { icon: '👨‍💻', color: '#10b981' },
  pago_registrado: { icon: '💳', color: '#10b981' },
  orden_lista:     { icon: '✅', color: '#10b981' },
  sistema:         { icon: '⚙️', color: '#f59e0b' },
};

// ── Polling cada 30 segundos ────────────────────────────
const POLL_INTERVAL = 30_000;

export default function NotificacionesPanel() {
  const [open, setOpen]             = useState(false);
  const [notifs, setNotifs]         = useState([]);
  const [noLeidas, setNoLeidas]     = useState(0);
  const [loading, setLoading]       = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef                    = useRef(null);
  const pollRef                     = useRef(null);

  // Obtener conteo sin abrir (para el badge)
  const fetchConteo = useCallback(async () => {
    try {
      const { data } = await api.get('/notificaciones/conteo/');
      setNoLeidas(data.no_leidas);
    } catch { /* silencioso */ }
  }, []);

  // Obtener lista completa (al abrir el panel)
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notificaciones/');
      setNotifs(data.results || []);
      setNoLeidas(data.no_leidas || 0);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  // Polling: conteo cada 30s
  useEffect(() => {
    fetchConteo();
    pollRef.current = setInterval(fetchConteo, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchConteo]);

  // Al abrir, cargar lista completa
  useEffect(() => {
    if (open) fetchNotifs();
  }, [open, fetchNotifs]);

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Marcar una como leída
  const marcarLeida = async (id) => {
    try {
      await api.post(`/notificaciones/${id}/leer/`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch { /* silencioso */ }
  };

  // Marcar todas como leídas
  const marcarTodas = async () => {
    setMarkingAll(true);
    try {
      await api.post('/notificaciones/leer_todas/');
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch { /* silencioso */ }
    finally { setMarkingAll(false); }
  };

  const noLeidasList = notifs.filter(n => !n.leida);
  const leidasList   = notifs.filter(n => n.leida);

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>

      {/* ── Botón campana ── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position:     'relative',
          background:   open ? 'rgba(6,182,212,0.1)' : 'var(--bg-hover)',
          border:       `1px solid ${open ? 'rgba(6,182,212,0.35)' : 'var(--border)'}`,
          borderRadius: '9px',
          padding:      '7px',
          cursor:       'pointer',
          color:        open ? 'var(--accent-cyan)' : 'var(--text-secondary)',
          display:      'flex',
          transition:   'all 0.15s',
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.borderColor = 'rgba(6,182,212,0.35)';
            e.currentTarget.style.color = 'var(--accent-cyan)';
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }}
        title="Notificaciones"
      >
        <Bell size={16} />
        {/* Badge */}
        {noLeidas > 0 && (
          <span style={{
            position:     'absolute',
            top:          '-5px',
            right:        '-5px',
            background:   '#ef4444',
            color:        '#fff',
            fontSize:     '10px',
            fontWeight:   '700',
            lineHeight:   '1',
            padding:      '2px 5px',
            borderRadius: '999px',
            minWidth:     '16px',
            textAlign:    'center',
            fontFamily:   'JetBrains Mono, monospace',
            border:       '2px solid var(--bg-secondary)',
            animation:    'pulse-red 2s infinite',
          }}>
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {/* ── Panel desplegable ── */}
      {open && (
        <div style={{
          position:     'fixed',
          top:          'calc(var(--topbar-h) + 8px)',
          right:        '16px',
          width:        'min(400px, calc(100vw - 32px))',
          maxHeight:    'min(520px, calc(100vh - 100px))',
          background:   'var(--bg-card)',
          border:       '1px solid var(--border-light)',
          borderRadius: '14px',
          boxShadow:    '0 20px 60px rgba(0,0,0,0.4)',
          display:      'flex',
          flexDirection:'column',
          animation:    'fadeInDown 0.2s ease',
          zIndex:       200,
          overflow:     'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding:        '14px 16px',
            borderBottom:   '1px solid var(--border)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            flexShrink:     0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={15} color="var(--accent-cyan)" />
              <span style={{ fontWeight: '600', fontSize: '14px' }}>Notificaciones</span>
              {noLeidas > 0 && (
                <span style={{
                  background:   'rgba(239,68,68,0.15)',
                  color:        '#ef4444',
                  border:       '1px solid rgba(239,68,68,0.3)',
                  fontSize:     '11px',
                  fontWeight:   '700',
                  padding:      '1px 7px',
                  borderRadius: '999px',
                }}>
                  {noLeidas} nueva{noLeidas !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodas}
                  disabled={markingAll}
                  title="Marcar todas como leídas"
                  style={{
                    background:   'none',
                    border:       '1px solid var(--border)',
                    borderRadius: '7px',
                    padding:      '5px 8px',
                    cursor:       'pointer',
                    color:        'var(--text-muted)',
                    fontSize:     '11px',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '4px',
                    transition:   'all 0.15s',
                    fontFamily:   'Space Grotesk, sans-serif',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  {markingAll
                    ? <div style={{ width: '11px', height: '11px', border: '1.5px solid var(--text-muted)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    : <CheckCheck size={12} />
                  }
                  Leer todo
                </button>
              )}
              <button
                onClick={fetchNotifs}
                disabled={loading}
                title="Actualizar"
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: '7px', padding: '5px',
                  cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <RefreshCw size={12} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: '7px', padding: '5px',
                  cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && notifs.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                <div style={{ width: '22px', height: '22px', border: '2px solid var(--border)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              </div>
            ) : notifs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>🔔</div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>Sin notificaciones</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Todo está al día</p>
              </div>
            ) : (
              <>
                {/* No leídas */}
                {noLeidasList.length > 0 && (
                  <div>
                    <div style={{
                      padding: '8px 16px 4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                      Nuevas
                    </div>
                    {noLeidasList.map(n => (
                      <NotifItem key={n.id} notif={n} onRead={marcarLeida} />
                    ))}
                  </div>
                )}

                {/* Leídas */}
                {leidasList.length > 0 && (
                  <div>
                    <div style={{
                      padding: '8px 16px 4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      borderTop: noLeidasList.length > 0 ? '1px solid var(--border)' : 'none',
                      marginTop: noLeidasList.length > 0 ? '4px' : '0',
                    }}>
                      Anteriores
                    </div>
                    {leidasList.map(n => (
                      <NotifItem key={n.id} notif={n} onRead={marcarLeida} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div style={{
              padding:    '10px 16px',
              borderTop:  '1px solid var(--border)',
              flexShrink: 0,
              display:    'flex',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {notifs.length} notificación{notifs.length !== 1 ? 'es' : ''} · actualiza cada 30s
              </span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50%       { box-shadow: 0 0 0 4px rgba(239,68,68,0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Item individual ────────────────────────────────────
function NotifItem({ notif, onRead }) {
  const cfg    = TIPO_CONFIG[notif.tipo] ?? { icon: '📋', color: '#94a3b8' };
  const isNew  = !notif.leida;

  return (
    <div
      onClick={() => { if (isNew) onRead(notif.id); }}
      style={{
        padding:    '12px 16px',
        display:    'flex',
        gap:        '11px',
        alignItems: 'flex-start',
        cursor:     isNew ? 'pointer' : 'default',
        background: isNew ? `${cfg.color}07` : 'transparent',
        borderLeft: isNew ? `3px solid ${cfg.color}` : '3px solid transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (isNew) e.currentTarget.style.background = `${cfg.color}12`; }}
      onMouseLeave={e => { if (isNew) e.currentTarget.style.background = `${cfg.color}07`; }}
    >
      {/* Icono */}
      <div style={{
        width:        '34px',
        height:       '34px',
        borderRadius: '50%',
        background:   `${cfg.color}15`,
        border:       `1px solid ${cfg.color}25`,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        fontSize:     '15px',
        flexShrink:   0,
        marginTop:    '1px',
      }}>
        {cfg.icon}
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:   '13px',
          fontWeight: isNew ? '600' : '500',
          color:      isNew ? 'var(--text-primary)' : 'var(--text-secondary)',
          marginBottom: '3px',
          lineHeight: '1.3',
        }}>
          {notif.titulo}
        </div>
        <div style={{
          fontSize:   '12px',
          color:      'var(--text-muted)',
          lineHeight: '1.4',
          marginBottom: '5px',
          display:    '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow:   'hidden',
        }}>
          {notif.mensaje}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={10} color="var(--text-muted)" />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {notif.fecha_display}
          </span>
          {isNew && (
            <span style={{
              marginLeft:   '6px',
              width:        '6px',
              height:       '6px',
              borderRadius: '50%',
              background:   cfg.color,
              display:      'inline-block',
              flexShrink:   0,
            }} />
          )}
        </div>
      </div>
    </div>
  );
}