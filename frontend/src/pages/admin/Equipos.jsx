// src/pages/admin/Equipos.jsx
import { useEffect, useState } from 'react';
import { Monitor, Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { getEquipos, createEquipo, updateEquipo, deleteEquipo } from '../../api/equipos';
import { getClientes } from '../../api/clientes';

const TIPOS = [
  { value:'', label:'Todos' },
  { value:'netbook', label:'Netbook' },
  { value:'cpu', label:'CPU / PC' },
  { value:'monitor', label:'Monitor' },
  { value:'impresora', label:'Impresora' },
  { value:'laptop', label:'Laptop' },
  { value:'otro', label:'Otro' },
];

const TIPO_ICONS = { netbook:'💻', cpu:'🖥️', monitor:'🖥', impresora:'🖨️', laptop:'💻', otro:'⚙️' };

export default function Equipos() {
  const [equipos, setEquipos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, data: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const emptyForm = { cliente:'', tipo:'cpu', marca:'', modelo:'', numero_serie:'', sistema_operativo:'', procesador:'', ram:'', almacenamiento:'', descripcion_adicional:'' };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const params = {};
      if (tipoFilter) params.tipo = tipoFilter;
      if (search) params.search = search;
      const [eRes, cRes] = await Promise.all([getEquipos(params), getClientes()]);
      setEquipos(eRes.data.results || eRes.data);
      setClientes(cRes.data.results || cRes.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [tipoFilter, search]);

  const openCreate = () => { setForm(emptyForm); setModal({ open: true, data: null }); };
  const openEdit = (eq) => {
    setForm({
      cliente: eq.cliente_detalle?.id || eq.cliente,
      tipo: eq.tipo, marca: eq.marca, modelo: eq.modelo,
      numero_serie: eq.numero_serie, sistema_operativo: eq.sistema_operativo,
      procesador: eq.procesador, ram: eq.ram, almacenamiento: eq.almacenamiento,
      descripcion_adicional: eq.descripcion_adicional
    });
    setModal({ open: true, data: eq });
  };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.data) await updateEquipo(modal.data.id, form);
      else await createEquipo(form);
      toast.success(modal.data ? 'Equipo actualizado' : 'Equipo registrado');
      setModal({ open: false, data: null }); load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const del = async () => {
    setSaving(true);
    try {
      await deleteEquipo(confirm.id);
      toast.success('Equipo eliminado');
      setConfirm({ open: false, id: null }); load();
    } catch { toast.error('Error al eliminar'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Equipos</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{equipos.length} equipo{equipos.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" placeholder="Buscar..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px', width: '200px' }} />
          </div>
          <select className="input-field" value={tipoFilter} onChange={e => setTipoFilter(e.target.value)} style={{ width: '140px' }}>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} /> Nuevo Equipo
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '28px', height: '28px', border: '2px solid var(--border)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : equipos.length === 0 ? (
        <div className="card"><EmptyState icon={Monitor} title="Sin equipos" subtitle="Registrá el primer equipo del taller" /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  {['Tipo', 'Marca / Modelo', 'Cliente', 'S.O.', 'N° Serie', 'Ingreso', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipos.map(eq => (
                  <tr key={eq.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{TIPO_ICONS[eq.tipo] || '⚙️'}</span>
                        <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          {eq.tipo_display}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{eq.marca}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{eq.modelo}</div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px' }}>
                      {eq.cliente_detalle?.nombre_completo}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{eq.sistema_operativo || '-'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{eq.numero_serie || '-'}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(eq.fecha_registro).toLocaleDateString('es-AR')}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(eq)} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.color = '#06b6d4'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setConfirm({ open: true, id: eq.id })} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Editar Equipo' : 'Registrar Equipo'} width="620px">
        <form onSubmit={save}>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Cliente *</label>
                <select className="input-field" value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} required>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Tipo *</label>
                <select className="input-field" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  {TIPOS.slice(1).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>Marca *</label>
                <input className="input-field" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} placeholder="HP, Dell, Epson..." required />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>Modelo *</label>
                <input className="input-field" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} placeholder="Pavilion 15, Inspiron..." required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>N° de Serie</label>
                <input className="input-field" value={form.numero_serie} onChange={e => setForm({ ...form, numero_serie: e.target.value })} placeholder="SN123456" />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>Sistema Operativo</label>
                <input className="input-field" value={form.sistema_operativo} onChange={e => setForm({ ...form, sistema_operativo: e.target.value })} placeholder="Windows 11 Home" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>Procesador</label>
                <input className="input-field" value={form.procesador} onChange={e => setForm({ ...form, procesador: e.target.value })} placeholder="Intel i5-10th" />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>RAM</label>
                <input className="input-field" value={form.ram} onChange={e => setForm({ ...form, ram: e.target.value })} placeholder="8 GB DDR4" />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>Almacenamiento</label>
                <input className="input-field" value={form.almacenamiento} onChange={e => setForm({ ...form, almacenamiento: e.target.value })} placeholder="256 GB SSD" />
              </div>
            </div>
            <div><label style={{ display: 'block', marginBottom: '6px' }}>Descripción adicional</label>
              <textarea className="input-field" rows={2} value={form.descripcion_adicional}
                onChange={e => setForm({ ...form, descripcion_adicional: e.target.value })}
                placeholder="Accesorios, estado del equipo, observaciones..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => setModal({ open: false, data: null })}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : modal.data ? 'Guardar' : 'Registrar Equipo'}</button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={del} loading={saving} title="¿Eliminar equipo?" message="Se eliminarán también todas las órdenes de trabajo asociadas a este equipo." />

    </div>
  );
}