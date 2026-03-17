// src/pages/admin/Presupuestos.jsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileText, Send, CheckCircle, XCircle,
         ArrowRight, Download, Eye, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import PresupuestoModal from '../../components/common/PresupuestoModal';

const ESTADO_CFG = {
  borrador:   { label: 'Borrador',    bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' },
  enviado:    { label: 'Enviado',     bg: 'rgba(6,182,212,0.12)',   color: '#06b6d4' },
  aprobado:   { label: 'Aprobado',    bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  rechazado:  { label: 'Rechazado',   bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  vencido:    { label: 'Vencido',     bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  convertido: { label: 'Convertido',  bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
};

export default function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editando, setEditando]         = useState(null);
  const [detalle, setDetalle]           = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  const fetchPresupuestos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/presupuestos/');
      setPresupuestos(data.results ?? data);
    } catch { toast.error('Error al cargar presupuestos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPresupuestos(); }, [fetchPresupuestos]);

  const accion = async (id, endpoint, body = {}, confirmMsg = null) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setLoadingAction(id + endpoint);
    try {
      const { data } = await api.post(`/presupuestos/${id}/${endpoint}/`, body);
      setPresupuestos(prev => prev.map(p => p.id === id ? data : p));
      if (detalle?.id === id) setDetalle(data);
      toast.success('Acción realizada correctamente');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar');
    } finally { setLoadingAction(null); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este presupuesto?')) return;
    try {
      await api.delete(`/presupuestos/${id}/`);
      setPresupuestos(prev => prev.filter(p => p.id !== id));
      if (detalle?.id === id) setDetalle(null);
      toast.success('Presupuesto eliminado');
    } catch { toast.error('No se pudo eliminar'); }
  };

  const abrirPDF = (id) => {
    window.open(`${api.defaults.baseURL}/presupuestos/${id}/pdf/`, '_blank');
  };

  const convertir = async (id) => {
    if (!window.confirm('¿Convertir este presupuesto en una orden de trabajo?')) return;
    setLoadingAction(id + 'convertir');
    try {
      const { data } = await api.post(`/presupuestos/${id}/convertir/`);
      toast.success(data.mensaje);
      fetchPresupuestos();
      if (detalle?.id === id) {
        const { data: d } = await api.get(`/presupuestos/${id}/`);
        setDetalle(d);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al convertir');
    } finally { setLoadingAction(null); }
  };

  const filtrados = presupuestos.filter(p => {
    const matchE = filtroEstado === 'todos' || p.estado === filtroEstado;
    const q = busqueda.toLowerCase();
    const matchB = !q || p.titulo.toLowerCase().includes(q) ||
      p.cliente_nombre.toLowerCase().includes(q) ||
      p.numero_display.includes(q);
    return matchE && matchB;
  });

  const onGuardado = (pres) => {
    setPresupuestos(prev => {
      const idx = prev.findIndex(p => p.id === pres.id);
      return idx >= 0 ? prev.map(p => p.id === pres.id ? pres : p) : [pres, ...prev];
    });
    setModalOpen(false);
    setEditando(null);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>

      {/* ════ Lista ════ */}
      <div style={{ flex: detalle ? '0 0 420px' : 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Presupuestos</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {presupuestos.length} presupuesto{presupuestos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchPresupuestos} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex',
            }}>
              <RefreshCw size={15} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => { setEditando(null); setModalOpen(true); }} className="btn-primary" style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px',
            }}>
              <Plus size={15} /> Nuevo presupuesto
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" placeholder="Buscar..." value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px' }}>
            {['todos', 'borrador', 'enviado', 'aprobado', 'rechazado', 'convertido'].map(e => (
              <button key={e} onClick={() => setFiltroEstado(e)} style={{
                padding: '5px 10px', borderRadius: '6px', border: 'none',
                background: filtroEstado === e ? 'var(--accent-cyan)' : 'transparent',
                color: filtroEstado === e ? '#080c14' : 'var(--text-muted)',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.15s',
                textTransform: 'capitalize', whiteSpace: 'nowrap',
              }}>
                {e === 'todos' ? 'Todos' : ESTADO_CFG[e]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
              <div style={{ width: '24px', height: '24px', border: '2px solid var(--border)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <FileText size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>Sin presupuestos</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Creá uno nuevo con el botón de arriba</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {['#', 'Cliente', 'Título', 'Total', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => {
                  const cfg = ESTADO_CFG[p.estado] || ESTADO_CFG.borrador;
                  const isActive = detalle?.id === p.id;
                  return (
                    <tr key={p.id}
                      onClick={() => setDetalle(isActive ? null : p)}
                      style={{
                        borderTop: '1px solid var(--border)', cursor: 'pointer',
                        background: isActive ? 'rgba(6,182,212,0.04)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', fontSize: '12px' }}>#{p.numero_display}</td>
                      <td style={{ padding: '12px 14px' }}><span style={{ fontWeight: '500' }}>{p.cliente_nombre}</span></td>
                      <td style={{ padding: '12px 14px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.solicitud_cliente && <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '4px', padding: '1px 5px', marginRight: '5px', fontWeight: '700' }}>Solicitud</span>}
                        {p.titulo}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--accent-cyan)', whiteSpace: 'nowrap' }}>${Number(p.total).toLocaleString('es-AR')}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: cfg.bg, color: cfg.color, fontWeight: '700', border: `1px solid ${cfg.color}30` }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                          {p.estado === 'borrador' && (
                            <>
                              <ActionBtn title="Editar" color="#06b6d4" onClick={() => { setEditando(p); setModalOpen(true); }}>
                                <Edit2 size={13} />
                              </ActionBtn>
                              <ActionBtn title="Enviar al cliente" color="#10b981"
                                loading={loadingAction === p.id + 'enviar'}
                                onClick={() => accion(p.id, 'enviar', {}, '¿Enviar este presupuesto al cliente?')}>
                                <Send size={13} />
                              </ActionBtn>
                              <ActionBtn title="Eliminar" color="#ef4444" onClick={() => eliminar(p.id)}>
                                <Trash2 size={13} />
                              </ActionBtn>
                            </>
                          )}
                          {p.estado === 'aprobado' && !p.orden && (
                            <ActionBtn title="Convertir a orden" color="#8b5cf6"
                              loading={loadingAction === p.id + 'convertir'}
                              onClick={() => convertir(p.id)}>
                              <ArrowRight size={13} />
                            </ActionBtn>
                          )}
                          <ActionBtn title="Ver PDF" color="#94a3b8" onClick={() => abrirPDF(p.id)}>
                            <Download size={13} />
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ════ Panel de detalle ════ */}
      {detalle && (
        <DetallePanel
          pres={detalle}
          onClose={() => setDetalle(null)}
          onAccion={accion}
          onConvertir={convertir}
          onPDF={abrirPDF}
          loadingAction={loadingAction}
        />
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <PresupuestoModal
          presupuesto={editando}
          onClose={() => { setModalOpen(false); setEditando(null); }}
          onGuardado={onGuardado}
        />
      )}

      <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── Botón de acción pequeño ──────────────────────────
function ActionBtn({ title, color, onClick, loading, children }) {
  return (
    <button onClick={onClick} title={title} disabled={loading} style={{
      width: '28px', height: '28px', borderRadius: '6px',
      background: `${color}12`, border: `1px solid ${color}25`,
      color, cursor: loading ? 'wait' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}12`; }}
    >
      {loading
        ? <div style={{ width: '10px', height: '10px', border: `1.5px solid ${color}40`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        : children
      }
    </button>
  );
}

// ── Panel lateral de detalle ────────────────────────
function DetallePanel({ pres, onClose, onAccion, onConvertir, onPDF, loadingAction }) {
  const cfg = ESTADO_CFG[pres.estado] || ESTADO_CFG.borrador;
  const [detalleCompleto, setDetalleCompleto] = useState(null);

  useEffect(() => {
    api.get(`/presupuestos/${pres.id}/`).then(({ data }) => setDetalleCompleto(data)).catch(() => {});
  }, [pres.id]);

  const d = detalleCompleto || pres;

  return (
    <div style={{
      flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '14px', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', minWidth: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>#{pres.numero_display}</span>
            <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: cfg.bg, color: cfg.color, fontWeight: '700', border: `1px solid ${cfg.color}30` }}>
              {cfg.label}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{pres.cliente_nombre}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => onPDF(pres.id)} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
            fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Download size={13} /> PDF
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}>
            <XCircle size={18} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Título y descripción */}
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>{d.titulo}</h3>
        {d.descripcion && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>{d.descripcion}</p>}

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[
            ['Fecha emisión', d.fecha_envio ? new Date(d.fecha_envio).toLocaleDateString('es-AR') : '—'],
            ['Válido hasta', d.fecha_vencimiento ? new Date(d.fecha_vencimiento).toLocaleDateString('es-AR') : '—'],
            ['Validez', `${d.validez_dias} días`],
            ['Equipo', d.equipo_nombre || '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '10px 12px' }}>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 3px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>{label}</p>
              <p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Ítems */}
        {d.items && d.items.length > 0 && (
          <>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Ítems</p>
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
              {d.items.map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                }}>
                  <div>
                    <p style={{ fontSize: '13px', margin: 0, fontWeight: '500' }}>{item.descripcion}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      {item.cantidad} × ${Number(item.precio_unit).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>${Number(item.subtotal).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Totales */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Subtotal</span>
            <span style={{ fontSize: '13px' }}>${Number(d.subtotal).toLocaleString('es-AR')}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700' }}>TOTAL</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-cyan)' }}>${Number(d.total).toLocaleString('es-AR')}</span>
          </div>
        </div>

        {/* Motivo rechazo */}
        {d.motivo_rechazo && (
          <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700', margin: '0 0 4px', textTransform: 'uppercase' }}>Motivo de rechazo</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{d.motivo_rechazo}</p>
          </div>
        )}

        {/* Condiciones */}
        {d.condiciones && (
          <div style={{ marginTop: '14px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Condiciones</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>{d.condiciones}</p>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {pres.estado === 'borrador' && (
          <button onClick={() => onAccion(pres.id, 'enviar', {}, '¿Enviar al cliente?')}
            disabled={loadingAction === pres.id + 'enviar'}
            className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '9px 14px' }}>
            <Send size={14} /> Enviar al cliente
          </button>
        )}
        {pres.estado === 'aprobado' && !pres.orden && (
          <button onClick={() => onConvertir(pres.id)}
            disabled={loadingAction === pres.id + 'convertir'}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
              padding: '9px 14px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.3)',
              background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600',
            }}>
            <ArrowRight size={14} /> Convertir a orden
          </button>
        )}
        {pres.orden && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={13} color="#10b981" /> Orden #{String(pres.orden).padStart(4,'0')} creada
          </div>
        )}
      </div>
    </div>
  );
}