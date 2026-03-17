// src/pages/cliente/MisPresupuestos.jsx
import { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle, XCircle, Download, Clock, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const ESTADO_CFG = {
  enviado:    { label: 'Pendiente',   bg: 'rgba(6,182,212,0.12)',   color: '#06b6d4', icon: '📋' },
  aprobado:   { label: 'Aprobado',    bg: 'rgba(16,185,129,0.12)',  color: '#10b981', icon: '✅' },
  rechazado:  { label: 'Rechazado',   bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', icon: '❌' },
  vencido:    { label: 'Vencido',     bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', icon: '⏰' },
  convertido: { label: 'En proceso',  bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', icon: '🔧' },
};

export default function MisPresupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalle, setDetalle]           = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRechazo, setShowRechazo]   = useState(false);
  const [loadingAcc, setLoadingAcc]     = useState(null);
  const [modalSolicitar, setModalSolicitar] = useState(false);

  const fetchPresupuestos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/presupuestos/');
      setPresupuestos(data.results ?? data);
    } catch { toast.error('Error al cargar presupuestos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPresupuestos(); }, [fetchPresupuestos]);

  const abrirDetalle = async (p) => {
    setSeleccionado(p);
    setDetalle(null);
    setShowRechazo(false);
    try {
      const { data } = await api.get(`/presupuestos/${p.id}/`);
      setDetalle(data);
    } catch { toast.error('Error al cargar detalle'); }
  };

  const aprobar = async () => {
    if (!seleccionado) return;
    setLoadingAcc('aprobar');
    try {
      const { data } = await api.post(`/presupuestos/${seleccionado.id}/aprobar/`);
      toast.success('¡Presupuesto aprobado! El taller fue notificado.');
      setPresupuestos(prev => prev.map(p => p.id === seleccionado.id ? data : p));
      setSeleccionado(data);
      setDetalle(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al aprobar');
    } finally { setLoadingAcc(null); }
  };

  const rechazar = async () => {
    if (!seleccionado) return;
    setLoadingAcc('rechazar');
    try {
      const { data } = await api.post(`/presupuestos/${seleccionado.id}/rechazar/`, { motivo: motivoRechazo });
      toast.success('Presupuesto rechazado.');
      setPresupuestos(prev => prev.map(p => p.id === seleccionado.id ? data : p));
      setSeleccionado(data);
      setDetalle(data);
      setShowRechazo(false);
      setMotivoRechazo('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al rechazar');
    } finally { setLoadingAcc(null); }
  };

  const abrirPDF = (id) => window.open(`${api.defaults.baseURL}/presupuestos/${id}/pdf/`, '_blank');

  const pendientes = presupuestos.filter(p => p.estado === 'enviado');
  const resto      = presupuestos.filter(p => p.estado !== 'enviado');

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Mis Presupuestos</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Revisá y aprobá los presupuestos enviados por el taller
          </p>
        </div>
        <button onClick={() => setModalSolicitar(true)} className="btn-primary" style={{
          display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', fontSize: '13px',
        }}>
          <Plus size={15} /> Solicitar presupuesto
        </button>
      </div>

      {/* Alerta pendientes */}
      {pendientes.length > 0 && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
          background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.2)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <AlertTriangle size={16} color="#06b6d4" />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Tenés <strong style={{ color: 'var(--accent-cyan)' }}>{pendientes.length}</strong> presupuesto{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''} de revisión
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '26px', height: '26px', border: '2px solid var(--border)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : presupuestos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px' }}>
          <FileText size={36} color="var(--text-muted)" style={{ marginBottom: '14px' }} />
          <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Sin presupuestos</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>El taller te enviará presupuestos cuando lo necesites</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: seleccionado ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {seleccionado ? (
            /* ── Vista detalle ── */
            <DetallePresupuesto
              pres={detalle || seleccionado}
              onVolver={() => setSeleccionado(null)}
              onAprobar={aprobar}
              onRechazar={rechazar}
              showRechazo={showRechazo}
              setShowRechazo={setShowRechazo}
              motivoRechazo={motivoRechazo}
              setMotivoRechazo={setMotivoRechazo}
              loadingAcc={loadingAcc}
              onPDF={abrirPDF}
            />
          ) : (
            /* ── Tarjetas ── */
            [...pendientes, ...resto].map(p => (
              <TarjetaPresupuesto key={p.id} pres={p} onClick={() => abrirDetalle(p)} onPDF={abrirPDF} />
            ))
          )}
        </div>
      )}

      {modalSolicitar && (
        <SolicitarPresupuestoModal
          onClose={() => setModalSolicitar(false)}
          onEnviado={(nuevo) => {
            setModalSolicitar(false);
            toast.info('Tu solicitud fue recibida. El taller preparará el presupuesto.');
          }}
        />
      )}

      <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── Tarjeta de presupuesto ───────────────────────────
function TarjetaPresupuesto({ pres, onClick, onPDF }) {
  const cfg = ESTADO_CFG[pres.estado] || { label: pres.estado, bg: 'transparent', color: '#94a3b8', icon: '📄' };
  const esPendiente = pres.estado === 'enviado';

  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${esPendiente ? 'rgba(6,182,212,0.3)' : 'var(--border)'}`,
      borderRadius: '14px', padding: '20px', cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: esPendiente ? '0 0 0 1px rgba(6,182,212,0.1)' : 'none',
    }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = esPendiente ? '0 0 0 1px rgba(6,182,212,0.1)' : 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px' }}>{cfg.icon}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              #{pres.numero_display}
            </span>
          </div>
          <p style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>{pres.titulo}</p>
        </div>
        <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: cfg.bg, color: cfg.color, fontWeight: '700', border: `1px solid ${cfg.color}30`, flexShrink: 0 }}>
          {cfg.label}
        </span>
      </div>

      {pres.equipo_nombre && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px' }}>🖥 {pres.equipo_nombre}</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-cyan)', margin: 0 }}>
            ${Number(pres.total).toLocaleString('es-AR')}
          </p>
          {pres.fecha_vencimiento && pres.estado === 'enviado' && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={10} /> Válido hasta {new Date(pres.fecha_vencimiento).toLocaleDateString('es-AR')}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onPDF(pres.id)} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex',
          }} title="Ver PDF">
            <Download size={14} />
          </button>
          {esPendiente && (
            <div style={{ padding: '6px 12px', borderRadius: '7px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: 'var(--accent-cyan)', fontSize: '12px', fontWeight: '600' }}>
              Revisar →
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Vista detalle + acciones ─────────────────────────
function DetallePresupuesto({ pres, onVolver, onAprobar, onRechazar, showRechazo, setShowRechazo, motivoRechazo, setMotivoRechazo, loadingAcc, onPDF }) {
  const cfg = ESTADO_CFG[pres.estado] || { label: pres.estado, color: '#94a3b8', bg: 'transparent' };
  const esPendiente = pres.estado === 'enviado';

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onVolver} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1, display: 'flex', alignItems: 'center' }}>←</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '700' }}>Presupuesto #{pres.numero_display}</span>
              <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: cfg.bg, color: cfg.color, fontWeight: '700' }}>{cfg.label}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>{pres.titulo}</p>
          </div>
        </div>
        <button onClick={() => onPDF(pres.id)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
          cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'Space Grotesk, sans-serif',
        }}>
          <Download size={14} /> Descargar PDF
        </button>
      </div>

      <div style={{ padding: '22px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Izquierda: info + ítems */}
        <div>
          {pres.descripcion && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Descripción</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>{pres.descripcion}</p>
            </div>
          )}

          {pres.equipo_nombre && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '13px' }}>
              🖥 Equipo: <strong>{pres.equipo_nombre}</strong>
            </div>
          )}

          {/* Ítems */}
          {pres.items && pres.items.length > 0 && (
            <>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Detalle de ítems</p>
              <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      {['Descripción', 'Cant.', 'P. Unit.', 'Subtotal'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Descripción' ? 'left' : 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pres.items.map((item, i) => (
                      <tr key={item.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
                        <td style={{ padding: '10px 14px' }}>{item.descripcion}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>{item.cantidad}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>${Number(item.precio_unit).toLocaleString('es-AR')}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600' }}>${Number(item.subtotal).toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {pres.condiciones && (
            <div style={{ padding: '12px 14px', background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: '8px' }}>
              <p style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '700', margin: '0 0 4px', textTransform: 'uppercase' }}>Condiciones y garantía</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>{pres.condiciones}</p>
            </div>
          )}
        </div>

        {/* Derecha: totales + acciones */}
        <div>
          {/* Totales */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Subtotal</span>
              <span style={{ fontSize: '13px' }}>${Number(pres.subtotal).toLocaleString('es-AR')}</span>
            </div>
  
            <div style={{ borderTop: '2px solid var(--accent-cyan)', paddingTop: '12px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '700' }}>TOTAL</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                  ${Number(pres.total).toLocaleString('es-AR')}
                </span>
              </div>
            </div>
            {pres.fecha_vencimiento && esPendiente && (
              <div style={{ marginTop: '10px', padding: '8px 10px', background: 'rgba(245,158,11,0.08)', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} color="#f59e0b" />
                <span style={{ fontSize: '11px', color: '#f59e0b' }}>
                  Válido hasta {new Date(pres.fecha_vencimiento).toLocaleDateString('es-AR')}
                </span>
              </div>
            )}
          </div>

          {/* Acciones cliente */}
          {esPendiente && !showRechazo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={onAprobar} disabled={loadingAcc === 'aprobar'} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '13px', borderRadius: '10px', border: 'none',
                background: '#10b981', color: '#fff', cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: '700',
                transition: 'all 0.2s', opacity: loadingAcc ? 0.7 : 1,
              }}
                onMouseEnter={e => { if (!loadingAcc) e.currentTarget.style.background = '#059669'; }}
                onMouseLeave={e => { if (!loadingAcc) e.currentTarget.style.background = '#10b981'; }}
              >
                {loadingAcc === 'aprobar'
                  ? <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  : <CheckCircle size={16} />
                }
                Aprobar presupuesto
              </button>
              <button onClick={() => setShowRechazo(true)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '13px', borderRadius: '10px',
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.06)', color: '#ef4444',
                cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
              >
                <XCircle size={16} /> Rechazar
              </button>
            </div>
          )}

          {/* Formulario rechazo */}
          {esPendiente && showRechazo && (
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#ef4444' }}>¿Por qué rechazás este presupuesto?</p>
              <textarea className="input-field" rows={3} placeholder="Motivo del rechazo (opcional)..."
                value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)}
                style={{ marginBottom: '10px', fontSize: '13px', resize: 'none' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowRechazo(false)} style={{
                  flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px',
                }}>
                  Cancelar
                </button>
                <button onClick={onRechazar} disabled={loadingAcc === 'rechazar'} style={{
                  flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
                  background: '#ef4444', color: '#fff', cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: '600',
                }}>
                  {loadingAcc === 'rechazar' ? 'Enviando...' : 'Confirmar rechazo'}
                </button>
              </div>
            </div>
          )}

          {/* Estados finales */}
          {pres.estado === 'aprobado' && (
            <div style={{ padding: '14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', textAlign: 'center' }}>
              <CheckCircle size={24} color="#10b981" style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#10b981', margin: '0 0 4px' }}>Presupuesto aprobado</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>El taller procederá con el trabajo</p>
            </div>
          )}
          {pres.estado === 'rechazado' && (
            <div style={{ padding: '14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', textAlign: 'center' }}>
              <XCircle size={24} color="#ef4444" style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444', margin: '0 0 4px' }}>Presupuesto rechazado</p>
              {pres.motivo_rechazo && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{pres.motivo_rechazo}</p>}
            </div>
          )}
          {pres.estado === 'convertido' && (
            <div style={{ padding: '14px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>🔧</span>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#8b5cf6', margin: '0 0 4px' }}>En proceso</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>El trabajo está siendo realizado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal: Solicitar presupuesto (cliente) ───────────
export function SolicitarPresupuestoModal({ onClose, onEnviado }) {
  const [equipos, setEquipos]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [form, setForm] = useState({
    titulo:        'Solicitud de presupuesto',
    equipo:        '',
    nota_solicitud: '',
  });

  useEffect(() => {
    api.get('/equipos/').then(({ data }) => setEquipos(data.results ?? data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nota_solicitud.trim()) { toast.error('Describí el problema'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/presupuestos/solicitar/', form);
      toast.success('¡Solicitud enviada! El taller te responderá pronto.');
      onEnviado(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', width: '100%', maxWidth: '500px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        animation: 'fadeInUp 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📋</span>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Solicitar presupuesto</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>El taller te enviará el presupuesto a la brevedad</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px' }}>×</button>
        </div>

        {/* Body */}
        <form onSubmit={submit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Equipo */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              ¿Es para un equipo registrado? (opcional)
            </label>
            <select className="input-field" value={form.equipo} onChange={e => setForm(f => ({ ...f, equipo: e.target.value }))}>
              <option value="">No, es algo nuevo</option>
              {equipos.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.tipo} {eq.marca} {eq.modelo}</option>
              ))}
            </select>
          </div>

          {/* Problema */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Describí el problema o trabajo a realizar *
            </label>
            <textarea className="input-field" rows={5}
              placeholder="Ej: La pantalla de mi notebook tiene líneas horizontales y no enciende correctamente. También necesito limpieza de ventiladores."
              value={form.nota_solicitud}
              onChange={e => setForm(f => ({ ...f, nota_solicitud: e.target.value }))}
              required
              style={{ resize: 'vertical', fontSize: '13px', lineHeight: '1.5' }} />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '5px 0 0' }}>
              Cuanto más detallado, más preciso será el presupuesto
            </p>
          </div>

          {/* Info */}
          <div style={{ padding: '12px 14px', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            📬 Recibirás una notificación cuando el taller prepare tu presupuesto para que puedas aprobarlo o rechazarlo.
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px',
            }}>Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px', fontSize: '13px',
            }}>
              {loading
                ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#080c14', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Enviando...</>
                : '📤 Enviar solicitud'
              }
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}