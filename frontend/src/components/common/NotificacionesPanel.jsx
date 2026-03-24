// src/components/common/NotificacionesPanel.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck, Clock, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

const TIPO_CONFIG = {
  orden_nueva:     { icon: '🆕', color: '#06b6d4' },
  estado_cambio:   { icon: '🔄', color: '#8b5cf6' },
  orden_asignada:  { icon: '👨‍💻', color: '#10b981' },
  pago_registrado: { icon: '💳', color: '#10b981' },
  orden_lista:     { icon: '✅', color: '#10b981' },
  sistema:         { icon: '⚙️', color: '#f59e0b' },
};

const POLL_INTERVAL = 30_000;

export default function NotificacionesPanel() {
  const [open, setOpen]             = useState(false);
  const [notifs, setNotifs]         = useState([]);
  const [noLeidas, setNoLeidas]     = useState(0);
  const [loading, setLoading]       = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef                    = useRef(null);
  const btnRef                      = useRef(null);
  const pollRef                     = useRef(null);

  const fetchConteo = useCallback(async () => {
    try {
      const { data } = await api.get('/notificaciones/conteo/');
      setNoLeidas(data.no_leidas);
    } catch {}
  }, []);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notificaciones/');
      setNotifs(data.results || []);
      setNoLeidas(data.no_leidas || 0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchConteo();
    pollRef.current = setInterval(fetchConteo, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchConteo]);

  useEffect(() => {
    if (open) fetchNotifs();
  }, [open, fetchNotifs]);

  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current   && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const marcarLeida = async (id) => {
    try {
      await api.post(`/notificaciones/${id}/leer/`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const marcarTodas = async () => {
    setMarkingAll(true);
    try {
      await api.post('/notificaciones/leer_todas/');
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch {}
    finally { setMarkingAll(false); }
  };

  const noLeidasList = notifs.filter(n => !n.leida);
  const leidasList   = notifs.filter(n => n.leida);

  return (
    <div style={{ position: 'relative' }}>

      {/* Botón campana */}
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative',
          background: open ? 'rgba(6,182,212,0.1)' : 'var(--bg-secondary)',
          border: `1px solid ${open ? 'rgba(6,182,212,0.35)' : 'var(--border)'}`,
          borderRadius: '8px', padding: '7px', cursor: 'pointer',
          color: open ? 'var(--accent-cyan)' : 'var(--text-muted)',
          display: 'flex', transition: 'all 0.15s',
        }}
      >
        <Bell size={16} />
        {noLeidas > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            background: '#ef4444', color: '#fff',
            fontSize: '10px', fontWeight: '800', lineHeight: '1',
            padding: '2px 5px', borderRadius: '999px',
            minWidth: '16px', textAlign: 'center',
            border: '2px solid var(--bg-card)',
            animation: 'pulse-red 2s infinite',
          }}>
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel — posición fija relativa al viewport */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: '68px',
            right: '16px',
            width: 'min(420px, calc(100vw - 24px))',
            maxHeight: 'calc(100vh - 90px)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeInDown 0.18s ease',
            zIndex: 500,
            overflow: 'hidden',
          }}
        >

          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
            background: 'var(--bg-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={15} color="var(--accent-cyan)" />
              <span style={{ fontWeight: '700', fontSize: '14px' }}>Notificaciones</span>
              {noLeidas > 0 && (
                <span style={{
                  background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.3)',
                  fontSize: '11px', fontWeight: '700',
                  padding: '1px 7px', borderRadius: '999px',
                }}>
                  {noLeidas} nueva{noLeidas !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {noLeidas > 0 && (
                <button onClick={marcarTodas} disabled={markingAll} title="Marcar todas como leídas"
                  style={{
                    background: 'none', border: '1px solid var(--border)',
                    borderRadius: '7px', padding: '5px 8px', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '11px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.15s',
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
              <button onClick={fetchNotifs} disabled={loading} title="Actualizar"
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '7px', padding: '5px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <RefreshCw size={12} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
              </button>
              <button onClick={() => setOpen(false)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '7px', padding: '5px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Lista scrolleable */}
          <div style={{ overflowY: 'auto', flex: 1, overscrollBehavior: 'contain' }}>
            {loading && notifs.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px' }}>
                <div style={{ width: '22px', height: '22px', border: '2px solid var(--border)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              </div>
            ) : notifs.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔔</div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', margin: '0 0 4px' }}>Sin notificaciones</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Todo está al día</p>
              </div>
            ) : (
              <>
                {noLeidasList.length > 0 && (
                  <div>
                    <div style={{ padding: '10px 16px 4px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Nuevas ({noLeidasList.length})
                    </div>
                    {noLeidasList.map(n => <NotifItem key={n.id} notif={n} onRead={marcarLeida} />)}
                  </div>
                )}
                {leidasList.length > 0 && (
                  <div>
                    <div style={{
                      padding: '10px 16px 4px', fontSize: '10px', fontWeight: '700',
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
                      borderTop: noLeidasList.length > 0 ? '1px solid var(--border)' : 'none',
                      marginTop: noLeidasList.length > 0 ? '4px' : '0',
                    }}>
                      Anteriores
                    </div>
                    {leidasList.map(n => <NotifItem key={n.id} notif={n} onRead={marcarLeida} />)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div style={{
              padding: '10px 16px', borderTop: '1px solid var(--border)',
              flexShrink: 0, textAlign: 'center',
              background: 'var(--bg-secondary)',
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
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
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
  const cfg   = TIPO_CONFIG[notif.tipo] ?? { icon: '📋', color: '#94a3b8' };
  const isNew = !notif.leida;
  const [expandido, setExpandido] = useState(false);

  return (
    <div
      style={{
        padding: '12px 16px',
        display: 'flex', gap: '11px', alignItems: 'flex-start',
        cursor: 'pointer',
        background: isNew ? `${cfg.color}08` : 'transparent',
        borderLeft: `3px solid ${isNew ? cfg.color : 'transparent'}`,
        transition: 'background 0.15s',
        borderBottom: '1px solid var(--border)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${cfg.color}12`; }}
      onMouseLeave={e => { e.currentTarget.style.background = isNew ? `${cfg.color}08` : 'transparent'; }}
      onClick={() => {
        if (isNew) onRead(notif.id);
        setExpandido(v => !v);
      }}
    >
      {/* Icono */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: `${cfg.color}15`, border: `1px solid ${cfg.color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', marginTop: '1px',
      }}>
        {cfg.icon}
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px', fontWeight: isNew ? '700' : '500',
          color: isNew ? 'var(--text-primary)' : 'var(--text-secondary)',
          marginBottom: '4px', lineHeight: '1.35',
        }}>
          {notif.titulo}
        </div>

        {/* Mensaje — expandible, SIN clamp */}
        <div style={{
          fontSize: '12px', color: 'var(--text-muted)',
          lineHeight: '1.55', marginBottom: '6px',
          // Mensaje completo visible, sin recorte
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}>
          {notif.mensaje}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={10} color="var(--text-muted)" />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {notif.fecha_display}
          </span>
          {isNew && (
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: cfg.color, display: 'inline-block', marginLeft: '4px',
            }} />
          )}
        </div>
      </div>
    </div>
  );
}