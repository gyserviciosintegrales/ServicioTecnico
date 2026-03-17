import { useEffect, useState } from 'react';
import { ClipboardList, Search, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { getOrdenes, updateOrden, getPdfOrden } from '../../api/ordenes';

const ESTADOS = [
  { value:'ingresado', label:'Ingresado', color:'#06b6d4' },
  { value:'diagnostico', label:'En Diagnóstico', color:'#8b5cf6' },
  { value:'en_reparacion', label:'En Reparación', color:'#f59e0b' },
  { value:'esperando_repuesto', label:'Esperando Repuesto', color:'#f97316' },
  { value:'listo', label:'Listo para Retirar', color:'#10b981' },
  { value:'entregado', label:'Entregado', color:'#94a3b8' },
  { value:'sin_reparacion', label:'Sin Reparación', color:'#ef4444' },
];

export default function MisOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandido, setExpandido] = useState(null);
  const [modal, setModal] = useState({ open: false, data: null });
  const [form, setForm] = useState({ diagnostico:'', solucion_aplicada:'', estado:'', observaciones:'' });
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getOrdenes({});
      setOrdenes(data.results || data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = ordenes.filter(o =>
    o.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
    o.equipo_detalle?.marca?.toLowerCase().includes(search.toLowerCase()) ||
    String(o.id).includes(search)
  );

  const openEdit = (o) => {
    setForm({ diagnostico: o.diagnostico||'', solucion_aplicada: o.solucion_aplicada||'', estado: o.estado, observaciones: o.observaciones||'' });
    setModal({ open: true, data: o });
  };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await updateOrden(modal.data.id, form);
      toast.success('Orden actualizada');
      setModal({ open: false, data: null }); load();
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const downloadPdf = async (id) => {
    setPdfLoading(id);
    try {
      const { data } = await getPdfOrden(id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url;
      a.download = `orden_${String(id).padStart(4,'0')}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Error al generar PDF'); }
    finally { setPdfLoading(null); }
  };

  const getEst = (v) => ESTADOS.find(e => e.value === v) || ESTADOS[0];

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Mis Órdenes Asignadas</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          {filtered.length} orden{filtered.length !== 1 ? 'es' : ''} asignada{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative', maxWidth: '300px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" placeholder="Buscar por cliente, equipo o #..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '28px', height: '28px', border: '2px solid var(--border)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={ClipboardList} title="Sin órdenes asignadas" subtitle="El administrador te asignará órdenes próximamente" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(o => {
            const est = getEst(o.estado);
            const open = expandido === o.id;
            return (
              <div key={o.id} className="card" style={{ overflow: 'hidden', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = est.color + '50'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                {/* Header */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer' }}
                  onClick={() => setExpandido(open ? null : o.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                    <span className="mono" style={{ fontSize: '13px', color: est.color, fontWeight: '700', flexShrink: 0 }}>
                      #{String(o.id).padStart(4,'0')}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {o.cliente_nombre}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {o.equipo_detalle?.tipo_display} — {o.equipo_detalle?.marca} {o.equipo_detalle?.modelo}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '600', background: `${est.color}18`, color: est.color, border: `1px solid ${est.color}30` }}>
                      {o.estado_display}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(o.fecha_ingreso).toLocaleDateString('es-AR')}
                    </span>
                    {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Detalle expandido */}
                {open && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Problema reportado</div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{o.problema_reportado}</p>
                      </div>
                      {o.diagnostico && (
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnóstico</div>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{o.diagnostico}</p>
                        </div>
                      )}
                      {o.solucion_aplicada && (
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solución</div>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{o.solucion_aplicada}</p>
                        </div>
                      )}
                    </div>

                    {/* Datos del equipo */}
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', marginBottom: '14px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos del equipo</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        {[
                          ['SO', o.equipo_detalle?.sistema_operativo],
                          ['CPU', o.equipo_detalle?.procesador],
                          ['RAM', o.equipo_detalle?.ram],
                          ['Disco', o.equipo_detalle?.almacenamiento],
                          ['N° Serie', o.equipo_detalle?.numero_serie],
                        ].filter(([,v]) => v).map(([k, v]) => (
                          <div key={k}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{k}: </span>
                            <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => downloadPdf(o.id)} disabled={pdfLoading === o.id}
                        className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        {pdfLoading === o.id
                          ? <div style={{ width: '13px', height: '13px', border: '2px solid var(--text-muted)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                          : <FileText size={14} />}
                        Generar PDF
                      </button>
                      <button onClick={() => openEdit(o)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        Actualizar Estado
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal actualizar estado */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })}
        title={`Actualizar Orden #${String(modal.data?.id||0).padStart(4,'0')}`} width="500px">
        <form onSubmit={save}>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Estado actual</label>
              <select className="input-field" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Diagnóstico técnico</label>
              <textarea className="input-field" rows={3} value={form.diagnostico}
                onChange={e => setForm({ ...form, diagnostico: e.target.value })}
                placeholder="Resultado del diagnóstico..." style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Solución aplicada</label>
              <textarea className="input-field" rows={3} value={form.solucion_aplicada}
                onChange={e => setForm({ ...form, solucion_aplicada: e.target.value })}
                placeholder="Detalle de la reparación realizada..." style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Observaciones</label>
              <textarea className="input-field" rows={2} value={form.observaciones}
                onChange={e => setForm({ ...form, observaciones: e.target.value })}
                placeholder="Notas adicionales para el administrador..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => setModal({ open: false, data: null })}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Resumen'}</button>
            </div>
          </div>
        </form>
      </Modal>


    </div>
  );
}