// src/pages/admin/Ordenes.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardList, Plus, Search, Edit2, Trash2, FileText, Clock, ArrowRight, User, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { getOrdenes, createOrden, updateOrden, deleteOrden, getPdfOrden } from '../../api/ordenes';
import { getEquipos } from '../../api/equipos';
import { getTecnicos } from '../../api/tecnicos';
import api from '../../api/axios';

const ESTADOS = [
  { value:'', label:'Todos los estados' },
  { value:'ingresado',          label:'Ingresado',            color:'#06b6d4' },
  { value:'diagnostico',        label:'En Diagnóstico',        color:'#8b5cf6' },
  { value:'en_reparacion',      label:'En Reparación',         color:'#f59e0b' },
  { value:'esperando_repuesto', label:'Esperando Repuesto',    color:'#f97316' },
  { value:'listo',              label:'Listo para Retirar',    color:'#10b981' },
  { value:'entregado',          label:'Entregado',             color:'#94a3b8' },
  { value:'sin_reparacion',     label:'Sin Reparación',        color:'#ef4444' },
];

const CAMPO_ICONS = {
  estado:            '🔄',
  diagnostico:       '🔍',
  solucion_aplicada: '🔧',
  tecnico:           '👨‍💻',
  importe_mano_obra: '💰',
  importe_repuestos: '🔩',
  pagado:            '💳',
  fecha_egreso:      '📅',
  meses_garantia:    '🛡️',
  observaciones:     '📝',
};

const CAMPO_COLORS = {
  estado:            '#06b6d4',
  diagnostico:       '#8b5cf6',
  solucion_aplicada: '#10b981',
  tecnico:           '#f59e0b',
  pagado:            '#10b981',
  importe_mano_obra: '#10b981',
  importe_repuestos: '#10b981',
};

// ── Historial inline ─────────────────────────────────────
function HistorialPanel({ ordenId }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get(`/ordenes/${ordenId}/historial/`)
      .then(({ data }) => setHistorial(data))
      .catch(() => setHistorial([]))
      .finally(() => setLoading(false));
  }, [ordenId]);

  return (
    <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Clock size={14} color="#06b6d4" />
        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Historial de cambios</span>
        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}>
          {historial.length} entrada{historial.length !== 1 ? 's' : ''}
        </span>
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: '#06b6d4', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : historial.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>Sin cambios registrados aún</p>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '13px', top: '8px', bottom: '8px', width: '1px', background: 'linear-gradient(to bottom, var(--border), transparent)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {historial.map((entrada, idx) => {
              const color = CAMPO_COLORS[entrada.campo] ?? '#64748b';
              const icon  = CAMPO_ICONS[entrada.campo]  ?? '📋';
              return (
                <div key={entrada.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', animation: `fadeInUp 0.25s ease ${idx * 0.03}s both` }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, background: `${color}15`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', zIndex: 1, marginTop: '2px' }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '9px', padding: '10px 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', flexWrap: 'wrap', gap: '5px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color, padding: '2px 7px', borderRadius: '5px', background: `${color}12`, border: `1px solid ${color}25` }}>
                        {entrada.campo_display}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{entrada.fecha}</span>
                    </div>
                    {entrada.valor_anterior !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', padding: '2px 7px', borderRadius: '5px', textDecoration: 'line-through' }}>
                          {entrada.valor_anterior || '—'}
                        </span>
                        <ArrowRight size={11} color="var(--text-muted)" />
                        <span style={{ fontSize: '11px', fontWeight: '600', background: `${color}12`, border: `1px solid ${color}25`, color, padding: '2px 7px', borderRadius: '5px' }}>
                          {entrada.valor_nuevo || '—'}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={10} color="var(--text-muted)" />
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{entrada.usuario_nombre}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────
export default function Ordenes() {
  const [ordenes, setOrdenes]       = useState([]);
  const [equipos, setEquipos]       = useState([]);
  const [tecnicos, setTecnicos]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [pagoFilter, setPagoFilter] = useState('');
  const [modal, setModal]           = useState({ open: false, data: null });
  const [modalEstado, setModalEstado] = useState({ open: false, data: null }); // ← nuevo modal rápido
  const [confirm, setConfirm]       = useState({ open: false, id: null });
  const [saving, setSaving]         = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);
  const [historialAbierto, setHistorialAbierto] = useState(null);

  const emptyForm = {
    equipo:'', tecnico:'', problema_reportado:'', diagnostico:'',
    solucion_aplicada:'', estado:'ingresado', importe_mano_obra:'0',
    importe_repuestos:'0', pagado: false, fecha_egreso:'',
    meses_garantia:'3', observaciones:'',
  };
  const [form, setForm] = useState(emptyForm);

  // Form del modal rápido de estado
  const [formEstado, setFormEstado] = useState({
    estado:'', diagnostico:'', solucion_aplicada:'', observaciones:''
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (estadoFilter) params.estado  = estadoFilter;
      if (pagoFilter !== '') params.pagado = pagoFilter;
      if (search) params.search = search;
      const [oRes, eRes, tRes] = await Promise.all([
        getOrdenes(params), getEquipos({}), getTecnicos(),
      ]);
      setOrdenes(oRes.data.results || oRes.data);
      setEquipos(eRes.data.results || eRes.data);
      setTecnicos(tRes.data.results || tRes.data);
    } finally { setLoading(false); }
  }, [estadoFilter, pagoFilter, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(emptyForm); setModal({ open: true, data: null }); };
  const openEdit   = (o) => {
    setForm({
      equipo: o.equipo_detalle?.id || o.equipo,
      tecnico: o.tecnico_detalle?.id || o.tecnico || '',
      problema_reportado: o.problema_reportado,
      diagnostico: o.diagnostico || '',
      solucion_aplicada: o.solucion_aplicada || '',
      estado: o.estado,
      importe_mano_obra: o.importe_mano_obra,
      importe_repuestos: o.importe_repuestos,
      pagado: o.pagado,
      fecha_egreso: o.fecha_egreso || '',
      meses_garantia: o.meses_garantia,
      observaciones: o.observaciones || '',
    });
    setModal({ open: true, data: o });
  };

  // Abrir modal rápido de estado (igual al del técnico)
  const openActualizarEstado = (o) => {
    setFormEstado({
      estado: o.estado,
      diagnostico: o.diagnostico || '',
      solucion_aplicada: o.solucion_aplicada || '',
      observaciones: o.observaciones || '',
    });
    setModalEstado({ open: true, data: o });
  };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.tecnico)      delete payload.tecnico;
      if (!payload.fecha_egreso) delete payload.fecha_egreso;
      if (modal.data) await updateOrden(modal.data.id, payload);
      else            await createOrden(payload);
      toast.success(modal.data ? 'Orden actualizada' : 'Orden creada');
      setModal({ open: false, data: null });
      if (historialAbierto === modal.data?.id) setHistorialAbierto(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar');
    } finally { setSaving(false); }
  };

  // Guardar desde modal rápido de estado
  const saveEstado = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await updateOrden(modalEstado.data.id, formEstado);
      toast.success('Estado actualizado');
      setModalEstado({ open: false, data: null });
      if (historialAbierto === modalEstado.data.id) setHistorialAbierto(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const del = async () => {
    setSaving(true);
    try {
      await deleteOrden(confirm.id);
      toast.success('Orden eliminada');
      setConfirm({ open: false, id: null });
      if (historialAbierto === confirm.id) setHistorialAbierto(null);
      load();
    } catch { toast.error('Error al eliminar'); }
    finally { setSaving(false); }
  };

  const downloadPdf = async (id) => {
    setPdfLoading(id);
    try {
      const { data } = await getPdfOrden(id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `orden_${String(id).padStart(4, '0')}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Error al generar PDF'); }
    finally { setPdfLoading(null); }
  };

  const toggleHistorial = (id) => setHistorialAbierto(prev => prev === id ? null : id);
  const getEstado = (val) => ESTADOS.find(e => e.value === val) || ESTADOS[0];

  const btnBase = {
    background: 'var(--bg-hover)', border: '1px solid var(--border)',
    borderRadius: '7px', padding: '6px', cursor: 'pointer',
    color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.15s',
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Órdenes de Trabajo</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {ordenes.length} orden{ordenes.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={15} /> Nueva Orden
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" placeholder="Buscar orden..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px', width: '220px' }} />
        </div>
        <select className="input-field" value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)} style={{ width: '200px' }}>
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <select className="input-field" value={pagoFilter} onChange={e => setPagoFilter(e.target.value)} style={{ width: '160px' }}>
          <option value="">Todos los pagos</option>
          <option value="true">Pagados</option>
          <option value="false">Pendientes</option>
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: '#06b6d4', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : ordenes.length === 0 ? (
        <div className="card"><EmptyState icon={ClipboardList} title="Sin órdenes" subtitle="Creá la primera orden de trabajo" /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  {['#', 'Cliente / Equipo', 'Problema', 'Técnico', 'Estado', 'Total', 'Pago', ''].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenes.map(o => {
                  const est         = getEstado(o.estado);
                  const histAbierto = historialAbierto === o.id;
                  return (
                    <React.Fragment key={o.id}>
                      <tr style={{ borderBottom: histAbierto ? 'none' : '1px solid var(--border)', transition: 'background 0.15s', background: histAbierto ? 'var(--bg-hover)' : 'transparent' }}
                        onMouseEnter={e => { if (!histAbierto) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => { if (!histAbierto) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
                            #{String(o.id).padStart(4, '0')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{o.cliente_nombre}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {o.equipo_detalle?.tipo_display} — {o.equipo_detalle?.marca} {o.equipo_detalle?.modelo}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: '160px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {o.problema_reportado}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {o.tecnico_detalle?.nombre_completo || <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '600', background: `${est.color}18`, color: est.color, border: `1px solid ${est.color}30` }}>
                            {o.estado_display}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace' }}>
                            ${parseFloat(o.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', fontWeight: '600', background: o.pagado ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: o.pagado ? '#10b981' : '#ef4444', border: `1px solid ${o.pagado ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                            {o.pagado ? '✓ Pagado' : '✗ Pendiente'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>

                            {/* PDF */}
                            <button onClick={() => downloadPdf(o.id)} disabled={pdfLoading === o.id} title="Descargar PDF" style={btnBase}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.color = '#8b5cf6'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                              {pdfLoading === o.id
                                ? <div style={{ width: '13px', height: '13px', border: '2px solid var(--text-muted)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                : <FileText size={13} />}
                            </button>

                            {/* ← NUEVO: Actualizar estado rápido */}
                            <button onClick={() => openActualizarEstado(o)} title="Actualizar estado" style={btnBase}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                              <RefreshCw size={13} />
                            </button>

                            {/* Editar completo */}
                            <button onClick={() => openEdit(o)} title="Editar orden completa" style={btnBase}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.color = '#06b6d4'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                              <Edit2 size={13} />
                            </button>

                            {/* Eliminar */}
                            <button onClick={() => setConfirm({ open: true, id: o.id })} title="Eliminar orden" style={btnBase}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                              <Trash2 size={13} />
                            </button>

                            {/* Historial */}
                            <button onClick={() => toggleHistorial(o.id)} title={histAbierto ? 'Cerrar historial' : 'Ver historial'}
                              style={{ ...btnBase, borderColor: histAbierto ? 'rgba(6,182,212,0.4)' : 'var(--border)', color: histAbierto ? '#06b6d4' : 'var(--text-secondary)', background: histAbierto ? 'rgba(6,182,212,0.08)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 9px' }}
                              onMouseEnter={e => { if (!histAbierto) { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'; e.currentTarget.style.color = '#06b6d4'; } }}
                              onMouseLeave={e => { if (!histAbierto) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}>
                              <Clock size={13} />
                              {histAbierto ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>

                          </div>
                        </td>
                      </tr>

                      {histAbierto && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
                            <HistorialPanel ordenId={o.id} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal rápido: Actualizar Estado (igual al técnico) ── */}
      <Modal open={modalEstado.open} onClose={() => setModalEstado({ open: false, data: null })}
        title={`Actualizar Orden #${String(modalEstado.data?.id || 0).padStart(4, '0')}`} width="500px">
        <form onSubmit={saveEstado}>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Estado</label>
              <select className="input-field" value={formEstado.estado} onChange={e => setFormEstado({ ...formEstado, estado: e.target.value })}>
                {ESTADOS.slice(1).map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Diagnóstico técnico</label>
              <textarea className="input-field" rows={3} value={formEstado.diagnostico}
                onChange={e => setFormEstado({ ...formEstado, diagnostico: e.target.value })}
                placeholder="Resultado del diagnóstico..." style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Solución aplicada</label>
              <textarea className="input-field" rows={3} value={formEstado.solucion_aplicada}
                onChange={e => setFormEstado({ ...formEstado, solucion_aplicada: e.target.value })}
                placeholder="Detalle de la reparación realizada..." style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Observaciones</label>
              <textarea className="input-field" rows={2} value={formEstado.observaciones}
                onChange={e => setFormEstado({ ...formEstado, observaciones: e.target.value })}
                placeholder="Notas adicionales..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => setModalEstado({ open: false, data: null })}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal completo editar/crear */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? `Editar Orden #${String(modal.data?.id || 0).padStart(4, '0')}` : 'Nueva Orden de Trabajo'}
        width="680px">
        <form onSubmit={save} translate="no">
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Equipo *</label>
                <select className="input-field" value={form.equipo} onChange={e => setForm({ ...form, equipo: e.target.value })} required>
                  <option value="">Seleccionar equipo...</option>
                  {equipos.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.cliente_nombre} — {eq.tipo_display} {eq.marca} {eq.modelo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Técnico</label>
                <select className="input-field" value={form.tecnico} onChange={e => setForm({ ...form, tecnico: e.target.value })}>
                  <option value="">Sin asignar</option>
                  {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre_completo} — #{t.legajo}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Problema reportado *</label>
              <textarea className="input-field" rows={2} value={form.problema_reportado}
                onChange={e => setForm({ ...form, problema_reportado: e.target.value })}
                placeholder="Descripción del problema..." required style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Diagnóstico técnico</label>
              <textarea className="input-field" rows={2} value={form.diagnostico}
                onChange={e => setForm({ ...form, diagnostico: e.target.value })}
                placeholder="Diagnóstico realizado..." style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Solución aplicada</label>
              <textarea className="input-field" rows={2} value={form.solucion_aplicada}
                onChange={e => setForm({ ...form, solucion_aplicada: e.target.value })}
                placeholder="Descripción de la reparación..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Estado</label>
                <select className="input-field" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                  {ESTADOS.slice(1).map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Fecha de Egreso</label>
                <input type="date" className="input-field" value={form.fecha_egreso} onChange={e => setForm({ ...form, fecha_egreso: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Garantía (meses)</label>
                <input type="number" className="input-field" min="0" max="24" value={form.meses_garantia} onChange={e => setForm({ ...form, meses_garantia: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Mano de Obra ($)</label>
                <input type="number" className="input-field" min="0" step="0.01" value={form.importe_mano_obra} onChange={e => setForm({ ...form, importe_mano_obra: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Repuestos ($)</label>
                <input type="number" className="input-field" min="0" step="0.01" value={form.importe_repuestos} onChange={e => setForm({ ...form, importe_repuestos: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Total estimado</label>
                <div className="input-field" style={{ color: '#10b981', fontWeight: '700', cursor: 'default', fontFamily: 'JetBrains Mono, monospace' }}>
                  ${(parseFloat(form.importe_mano_obra || 0) + parseFloat(form.importe_repuestos || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <input type="checkbox" id="pagado" checked={form.pagado} onChange={e => setForm({ ...form, pagado: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' }} />
              <label htmlFor="pagado" style={{ fontSize: '13px', cursor: 'pointer', color: form.pagado ? '#10b981' : 'var(--text-secondary)' }}>
                {form.pagado ? '✓ Pago registrado' : 'Marcar como pagado'}
              </label>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Observaciones</label>
              <textarea className="input-field" rows={2} value={form.observaciones}
                onChange={e => setForm({ ...form, observaciones: e.target.value })}
                placeholder="Notas internas adicionales..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => setModal({ open: false, data: null })}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : modal.data ? 'Guardar Cambios' : 'Crear Orden'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={del} loading={saving}
        title="¿Eliminar orden?" message="Se eliminará permanentemente esta orden de trabajo." />
    </div>
  );
}