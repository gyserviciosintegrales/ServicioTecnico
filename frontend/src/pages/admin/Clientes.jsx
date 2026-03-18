// src/pages/admin/Clientes.jsx
import { useEffect, useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, MapPin, Phone, CreditCard, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/axios';
import { getClientes, deleteCliente, updateCliente } from '../../api/clientes';
import CambiarRolModal from '../../components/common/CambiarRolModal';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, data: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [modalRol, setModalRol] = useState(null);
  const [form, setForm] = useState({ dni: '', direccion: '', ciudad: '', notas: '' });

  const load = async () => {
    try {
      const { data } = await getClientes();
      const list = data.results || data;
      setClientes(list); setFiltered(list);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(clientes.filter(c =>
      c.nombre_completo?.toLowerCase().includes(q) ||
      c.dni?.includes(q) ||
      c.usuario?.email?.toLowerCase().includes(q) ||
      c.ciudad?.toLowerCase().includes(q)
    ));
  }, [search, clientes]);

  const openEdit = (c) => {
    setForm({ dni: c.dni, direccion: c.direccion, ciudad: c.ciudad, notas: c.notas });
    setModal({ open: true, data: c });
  };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await updateCliente(modal.data.id, form);
      toast.success('Cliente actualizado');
      setModal({ open: false, data: null }); load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const del = async () => {
    setSaving(true);
    try {
      await deleteCliente(confirm.id);
      toast.success('Cliente eliminado');
      setConfirm({ open: false, id: null }); load();
    } catch { toast.error('Error al eliminar'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Clientes</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {filtered.length} registrado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" placeholder="Buscar cliente..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', width: '240px' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '28px', height: '28px', border: '2px solid var(--border)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="Sin clientes" subtitle="No hay clientes registrados aún" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map(c => (
            <div key={c.id} className="card" style={{ padding: '20px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: '700', color: '#06b6d4'
                  }}>
                    {c.nombre_completo?.split(' ').map(n => n[0]).slice(0,2).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.nombre_completo}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.usuario?.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => openEdit(c)} title="Editar" style={{
                    background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '7px',
                    padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.15s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.color = '#06b6d4'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => setModalRol(c.usuario)} title="Cambiar rol" style={{
                    background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '7px',
                    padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.15s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.color = '#8b5cf6'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    <Shield size={13} />
                  </button>
                  <button onClick={() => setConfirm({ open: true, id: c.id })} title="Eliminar" style={{
                    background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '7px',
                    padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.15s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <CreditCard size={12} color="var(--text-muted)" />
                  DNI: <span className="mono">{c.dni}</span>
                </div>
                {c.ciudad && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <MapPin size={12} color="var(--text-muted)" /> {c.ciudad}
                  </div>
                )}
                {c.usuario?.telefono && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <Phone size={12} color="var(--text-muted)" /> {c.usuario.telefono}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal editar */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title="Editar Cliente">
        <form onSubmit={save}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>DNI</label>
              <input className="input-field" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Ciudad</label>
                <input className="input-field" value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} placeholder="San Salvador de Jujuy" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Dirección</label>
                <input className="input-field" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Av. Belgrano 123" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Notas internas</label>
              <textarea className="input-field" rows={3} value={form.notas}
                onChange={e => setForm({ ...form, notas: e.target.value })}
                style={{ resize: 'vertical' }} placeholder="Observaciones sobre el cliente..." />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => setModal({ open: false, data: null })}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={del} loading={saving}
        title="¿Eliminar cliente?" message="Esta acción eliminará el cliente y todos sus datos asociados. No se puede deshacer." />

      {modalRol && (
        <CambiarRolModal
          usuario={modalRol}
          onClose={() => setModalRol(null)}
          onActualizado={(u) => {
            setClientes(prev => prev.map(x => x.usuario?.id === u.id ? { ...x, usuario: { ...x.usuario, rol: u.rol } } : x));
            setModalRol(null);
          }}
        />
      )}

    </div>
  );
}