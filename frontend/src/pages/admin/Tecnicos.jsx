// src/pages/admin/Tecnicos.jsx
import { useEffect, useState } from 'react';
import { Wrench, Plus, Search, Edit2, Trash2, Tag, ToggleLeft, ToggleRight, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/axios';
import { getTecnicos, createTecnico, updateTecnico, deleteTecnico, getEspecialidades, createEspecialidad } from '../../api/tecnicos';
import CambiarRolModal from '../../components/common/CambiarRolModal';

const COLORS = ['#06b6d4','#10b981','#8b5cf6','#f59e0b','#f97316','#ec4899','#3b82f6'];

export default function Tecnicos() {
  const [tecnicos, setTecnicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, data: null });
  const [espModal, setEspModal] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [modalRol, setModalRol] = useState(null);
  const [form, setForm] = useState({
    username:'', email:'', first_name:'', last_name:'',
    password:'', password2:'', telefono:'', legajo:'',
    especialidades_ids:[], disponible: true
  });
  const [newEsp, setNewEsp] = useState({ nombre:'', descripcion:'' });

  const load = async () => {
    try {
      const [tRes, eRes] = await Promise.all([getTecnicos(), getEspecialidades()]);
      setTecnicos(tRes.data.results || tRes.data);
      setEspecialidades(eRes.data.results || eRes.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = tecnicos.filter(t =>
    t.nombre_completo?.toLowerCase().includes(search.toLowerCase()) ||
    t.legajo?.includes(search) ||
    t.especialidades?.some(e => e.nombre.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    setForm({ username:'', email:'', first_name:'', last_name:'',
              password:'', password2:'', telefono:'', legajo:'', especialidades_ids:[], disponible: true });
    setModal({ open: true, data: null });
  };

  const openEdit = (t) => {
    setForm({
      username: t.usuario.username, email: t.usuario.email,
      first_name: t.usuario.first_name, last_name: t.usuario.last_name,
      telefono: t.usuario.telefono || '', legajo: t.legajo,
      password:'', password2:'', disponible: t.disponible,
      especialidades_ids: t.especialidades.map(e => e.id)
    });
    setModal({ open: true, data: t });
  };

  const toggleEsp = (id) => {
    setForm(f => ({
      ...f, especialidades_ids: f.especialidades_ids.includes(id)
        ? f.especialidades_ids.filter(x => x !== id)
        : [...f.especialidades_ids, id]
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!modal.data && form.password !== form.password2) { toast.error('Las contraseñas no coinciden'); return; }
    setSaving(true);
    try {
      if (modal.data) {
        await updateTecnico(modal.data.id, {
          legajo: form.legajo, disponible: form.disponible,
          especialidades_ids: form.especialidades_ids
        });
        await api.patch(`/auth/usuarios/${modal.data.usuario.id}/`, {
          first_name: form.first_name, last_name: form.last_name,
          email: form.email, telefono: form.telefono
        });
      } else {
        const { data: user } = await api.post('/auth/register/', {
          username: form.username, email: form.email,
          first_name: form.first_name, last_name: form.last_name,
          password: form.password, password2: form.password2,
          telefono: form.telefono, rol: 'tecnico'
        });
        await createTecnico({ usuario: user.id, legajo: form.legajo, disponible: form.disponible, especialidades_ids: form.especialidades_ids });
      }
      toast.success(modal.data ? 'Técnico actualizado' : 'Técnico creado');
      setModal({ open: false, data: null }); load();
    } catch (err) {
      const errors = err.response?.data;
      if (errors) Object.values(errors).forEach(m => toast.error(Array.isArray(m) ? m[0] : m));
    } finally { setSaving(false); }
  };

  const del = async () => {
    setSaving(true);
    try {
      await deleteTecnico(confirm.id);
      toast.success('Técnico eliminado');
      setConfirm({ open: false, id: null }); load();
    } catch { toast.error('Error al eliminar'); }
    finally { setSaving(false); }
  };

  const saveEsp = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await createEspecialidad(newEsp);
      toast.success('Especialidad creada');
      setNewEsp({ nombre:'', descripcion:'' }); setEspModal(false); load();
    } catch { toast.error('Error al crear especialidad'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Técnicos</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{filtered.length} técnico{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" placeholder="Buscar técnico..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px', width: '220px' }} />
          </div>
          <button className="btn-ghost" onClick={() => setEspModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={14} /> Especialidades
          </button>
          <button className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} /> Nuevo Técnico
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '28px', height: '28px', border: '2px solid var(--border)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Wrench} title="Sin técnicos" subtitle="Agregá el primer técnico del taller" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map((t, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <div key={t.id} className="card" style={{ padding: '20px' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = color + '60'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: color + '15', border: `1px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', fontWeight: '700', color
                    }}>
                      {t.nombre_completo?.split(' ').map(n => n[0]).slice(0,2).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{t.nombre_completo}</div>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#{t.legajo}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEdit(t)} title="Editar" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.color = '#06b6d4'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setModalRol(t.usuario)} title="Cambiar rol" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.color = '#8b5cf6'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                      <Shield size={13} />
                    </button>
                    <button onClick={() => setConfirm({ open: true, id: t.id })} title="Eliminar" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '600',
                    background: t.disponible ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                    color: t.disponible ? '#10b981' : '#94a3b8',
                    border: `1px solid ${t.disponible ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.25)'}`
                  }}>
                    {t.disponible ? '● Disponible' : '○ No disponible'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {t.especialidades.map(e => (
                    <span key={e.id} style={{
                      fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '500',
                      background: 'var(--bg-hover)', color: 'var(--text-secondary)',
                      border: '1px solid var(--border)'
                    }}>
                      {e.nombre}
                    </span>
                  ))}
                  {t.especialidades.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin especialidades</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal técnico */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Editar Técnico' : 'Nuevo Técnico'} width="580px">
        <form onSubmit={save}>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>Nombre</label>
                <input className="input-field" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>Apellido</label>
                <input className="input-field" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>Email</label>
                <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>Teléfono</label>
                <input className="input-field" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              </div>
            </div>
            {!modal.data && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={{ display: 'block', marginBottom: '6px' }}>Usuario</label>
                    <input className="input-field" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                  </div>
                  <div><label style={{ display: 'block', marginBottom: '6px' }}>Legajo</label>
                    <input className="input-field" value={form.legajo} onChange={e => setForm({ ...form, legajo: e.target.value })} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={{ display: 'block', marginBottom: '6px' }}>Contraseña</label>
                    <input className="input-field" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                  </div>
                  <div><label style={{ display: 'block', marginBottom: '6px' }}>Confirmar</label>
                    <input className="input-field" type="password" value={form.password2} onChange={e => setForm({ ...form, password2: e.target.value })} required />
                  </div>
                </div>
              </>
            )}
            {modal.data && (
              <div><label style={{ display: 'block', marginBottom: '6px' }}>Legajo</label>
                <input className="input-field" value={form.legajo} onChange={e => setForm({ ...form, legajo: e.target.value })} required />
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>Especialidades</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {especialidades.map(e => {
                  const sel = form.especialidades_ids.includes(e.id);
                  return (
                    <button type="button" key={e.id} onClick={() => toggleEsp(e.id)} style={{
                      padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                      fontFamily: 'Space Grotesk, sans-serif', fontWeight: '500', transition: 'all 0.15s',
                      background: sel ? 'rgba(6,182,212,0.15)' : 'var(--bg-hover)',
                      color: sel ? '#06b6d4' : 'var(--text-secondary)',
                      border: `1px solid ${sel ? 'rgba(6,182,212,0.4)' : 'var(--border)'}`
                    }}>{e.nombre}</button>
                  );
                })}
                {especialidades.length === 0 && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Creá especialidades primero</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button type="button" onClick={() => setForm(f => ({ ...f, disponible: !f.disponible }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.disponible ? '#10b981' : 'var(--text-muted)', display: 'flex' }}>
                {form.disponible ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {form.disponible ? 'Disponible' : 'No disponible'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => setModal({ open: false, data: null })}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : modal.data ? 'Guardar Cambios' : 'Crear Técnico'}</button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal especialidades */}
      <Modal open={espModal} onClose={() => setEspModal(false)} title="Nueva Especialidad" width="400px">
        <form onSubmit={saveEsp}>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div><label style={{ display: 'block', marginBottom: '6px' }}>Nombre</label>
              <input className="input-field" value={newEsp.nombre} onChange={e => setNewEsp({ ...newEsp, nombre: e.target.value })} placeholder="Ej: Reparación de impresoras" required />
            </div>
            <div><label style={{ display: 'block', marginBottom: '6px' }}>Descripción</label>
              <textarea className="input-field" rows={2} value={newEsp.descripcion}
                onChange={e => setNewEsp({ ...newEsp, descripcion: e.target.value })}
                placeholder="Descripción opcional..." style={{ resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => setEspModal(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creando...' : 'Crear'}</button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={del} loading={saving} title="¿Eliminar técnico?" message="Se eliminará el técnico y su usuario del sistema." />

      {modalRol && (
        <CambiarRolModal
          usuario={modalRol}
          onClose={() => setModalRol(null)}
          onActualizado={(u) => {
            setTecnicos(prev => prev.map(x => x.usuario?.id === u.id ? { ...x, usuario: { ...x.usuario, rol: u.rol } } : x));
            setModalRol(null);
          }}
        />
      )}

    </div>
  );
}