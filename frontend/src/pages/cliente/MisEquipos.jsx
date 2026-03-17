import { useEffect, useState } from 'react';
import { Monitor, Plus, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/axios';

const TIPOS = [
  { value: 'netbook',    label: 'Netbook' },
  { value: 'cpu',        label: 'CPU / PC de escritorio' },
  { value: 'monitor',   label: 'Monitor' },
  { value: 'impresora', label: 'Impresora' },
  { value: 'laptop',    label: 'Laptop' },
  { value: 'otro',      label: 'Otro' },
];

const TIPO_ICONS  = { netbook:'💻', cpu:'🖥️', monitor:'🖥', impresora:'🖨️', laptop:'💻', otro:'⚙️' };
const TIPO_COLORS = { netbook:'#06b6d4', cpu:'#8b5cf6', monitor:'#10b981', impresora:'#f59e0b', laptop:'#06b6d4', otro:'#94a3b8' };

const EQUIPO_VACIO = {
  tipo: 'laptop', marca: '', modelo: '', numero_serie: '',
  sistema_operativo: '', procesador: '', ram: '', almacenamiento: '',
  descripcion_adicional: '',
};

export default function MisEquipos() {
  const [equipos, setEquipos]         = useState([]);
  const [perfil, setPerfil]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [modalEquipo, setModalEquipo] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [editando, setEditando]       = useState(null); // null = nuevo
  const [equipoForm, setEquipoForm]   = useState(EQUIPO_VACIO);
  const [perfilForm, setPerfilForm]   = useState({ dni: '', direccion: '', ciudad: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [eRes, pRes] = await Promise.all([
        api.get('/equipos/'),
        api.get('/clientes/mi_perfil/').catch(() => ({ data: { existe: false } })),
      ]);
      setEquipos(eRes.data.results ?? eRes.data);
      setPerfil(pRes.data?.existe === false ? null : pRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Equipo handlers ──────────────────────────────────
  const abrirNuevo = () => {
    if (!perfil) {
      toast.warning('Primero completá tu perfil antes de registrar equipos.');
      setModalPerfil(true);
      return;
    }
    setEditando(null);
    setEquipoForm(EQUIPO_VACIO);
    setModalEquipo(true);
  };

  const abrirEditar = (eq) => {
    setEditando(eq);
    setEquipoForm({
      tipo:                 eq.tipo,
      marca:                eq.marca,
      modelo:               eq.modelo,
      numero_serie:         eq.numero_serie         ?? '',
      sistema_operativo:    eq.sistema_operativo    ?? '',
      procesador:           eq.procesador           ?? '',
      ram:                  eq.ram                  ?? '',
      almacenamiento:       eq.almacenamiento       ?? '',
      descripcion_adicional: eq.descripcion_adicional ?? '',
    });
    setModalEquipo(true);
  };

  const handleEquipoChange = (e) => {
    const { name, value } = e.target;
    setEquipoForm(prev => ({ ...prev, [name]: value }));
  };

  const saveEquipo = async (e) => {
    e.preventDefault();
    if (!equipoForm.marca.trim() || !equipoForm.modelo.trim()) {
      toast.error('Marca y modelo son obligatorios');
      return;
    }
    setSaving(true);
    try {
      if (editando) {
        await api.patch(`/equipos/${editando.id}/`, equipoForm);
        toast.success('Equipo actualizado correctamente');
      } else {
        await api.post('/equipos/', equipoForm);
        toast.success('Equipo registrado correctamente');
      }
      setModalEquipo(false);
      load();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Error al guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Perfil handlers ──────────────────────────────────
  const savePerfil = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (perfil?.id) {
        await api.patch(`/clientes/${perfil.id}/`, perfilForm);
        toast.success('Perfil actualizado');
      } else {
        await api.post('/clientes/', perfilForm);
        toast.success('Perfil completado');
      }
      setModalPerfil(false);
      load();
    } catch (err) {
      toast.error('Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { width: '100%' };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>

      {/* Banner completar perfil */}
      {!loading && !perfil && (
        <div style={{
          padding: '14px 18px', borderRadius: '10px', marginBottom: '20px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b', marginBottom: '2px' }}>
                Completá tu perfil primero
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Necesitás completar tu perfil para poder registrar equipos.
              </div>
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => { setPerfilForm({ dni:'', direccion:'', ciudad:'' }); setModalPerfil(true); }}
            style={{ background: '#f59e0b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={13} /> Completar Perfil
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Mis Equipos</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {equipos.length} equipo{equipos.length !== 1 ? 's' : ''} registrado{equipos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {perfil && (
            <button className="btn-ghost" onClick={() => {
              setPerfilForm({ dni: perfil.dni ?? '', direccion: perfil.direccion ?? '', ciudad: perfil.ciudad ?? '' });
              setModalPerfil(true);
            }} style={{ fontSize: '13px' }}>
              Editar Mis Datos
            </button>
          )}
          <button
            className="btn-primary"
            onClick={abrirNuevo}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Plus size={14} /> Registrar Equipo
          </button>
        </div>
      </div>

      {/* Resumen perfil */}
      {perfil && (
        <div className="card" style={{
          padding: '16px 20px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          }}>👤</div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
              {perfil.nombre_completo}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {perfil.dni && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  DNI: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{perfil.dni}</span>
                </span>
              )}
              {perfil.ciudad && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📍 {perfil.ciudad}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Listado */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            border: '2px solid var(--border)', borderTopColor: '#06b6d4',
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      ) : equipos.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Monitor}
            title="Sin equipos registrados"
            subtitle="Registrá tu primer equipo usando el botón de arriba"
            action={perfil ? { label: 'Registrar Equipo', onClick: abrirNuevo } : null}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {equipos.map(eq => {
            const color = TIPO_COLORS[eq.tipo] ?? '#94a3b8';
            return (
              <div
                key={eq.id}
                className="card"
                style={{ padding: '20px', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${color}50`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                      background: `${color}15`, border: `1px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                    }}>
                      {TIPO_ICONS[eq.tipo] ?? '⚙️'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{eq.marca} {eq.modelo}</div>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                        background: `${color}15`, color, border: `1px solid ${color}25`, fontWeight: '600',
                      }}>
                        {eq.tipo_display ?? eq.tipo}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => abrirEditar(eq)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: '4px', borderRadius: '6px',
                      display: 'flex', alignItems: 'center',
                    }}
                    title="Editar equipo"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    ['S.O.',     eq.sistema_operativo],
                    ['CPU',      eq.procesador],
                    ['RAM',      eq.ram],
                    ['Disco',    eq.almacenamiento],
                    ['N° Serie', eq.numero_serie],
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span style={{ color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
                        {val}
                      </span>
                    </div>
                  ))}
                  {eq.descripcion_adicional && (
                    <p style={{
                      fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4',
                      borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px',
                    }}>
                      {eq.descripcion_adicional}
                    </p>
                  )}
                  <div style={{
                    borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '8px',
                    fontSize: '11px', color: 'var(--text-muted)',
                  }}>
                    Registrado: {new Date(eq.fecha_registro).toLocaleDateString('es-AR')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Equipo ── */}
      <Modal
        open={modalEquipo}
        onClose={() => setModalEquipo(false)}
        title={editando ? 'Editar Equipo' : 'Registrar Equipo'}
        width="520px"
      >
        <form onSubmit={saveEquipo} translate="no">
          <div style={{ display: 'grid', gap: '14px' }}>

            {/* Tipo */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Tipo de equipo *</label>
              <select
                className="input-field"
                name="tipo"
                value={equipoForm.tipo}
                onChange={handleEquipoChange}
                style={inputStyle}
              >
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Marca / Modelo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Marca *</label>
                <input
                  className="input-field"
                  name="marca"
                  placeholder="HP, Dell, Lenovo..."
                  value={equipoForm.marca}
                  onChange={handleEquipoChange}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Modelo *</label>
                <input
                  className="input-field"
                  name="modelo"
                  placeholder="Pavilion 15, Inspiron..."
                  value={equipoForm.modelo}
                  onChange={handleEquipoChange}
                  required
                />
              </div>
            </div>

            {/* N° Serie / S.O. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>N° Serie</label>
                <input
                  className="input-field"
                  name="numero_serie"
                  placeholder="ABC123XYZ"
                  value={equipoForm.numero_serie}
                  onChange={handleEquipoChange}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Sistema Operativo</label>
                <input
                  className="input-field"
                  name="sistema_operativo"
                  placeholder="Windows 11, Ubuntu..."
                  value={equipoForm.sistema_operativo}
                  onChange={handleEquipoChange}
                />
              </div>
            </div>

            {/* CPU / RAM / Disco */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Procesador</label>
                <input
                  className="input-field"
                  name="procesador"
                  placeholder="i5-1135G7"
                  value={equipoForm.procesador}
                  onChange={handleEquipoChange}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>RAM</label>
                <input
                  className="input-field"
                  name="ram"
                  placeholder="8GB DDR4"
                  value={equipoForm.ram}
                  onChange={handleEquipoChange}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px' }}>Almacenamiento</label>
                <input
                  className="input-field"
                  name="almacenamiento"
                  placeholder="512GB SSD"
                  value={equipoForm.almacenamiento}
                  onChange={handleEquipoChange}
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Descripción adicional</label>
              <textarea
                className="input-field"
                name="descripcion_adicional"
                placeholder="Cualquier detalle extra del equipo..."
                value={equipoForm.descripcion_adicional}
                onChange={handleEquipoChange}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => setModalEquipo(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {saving ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Registrar Equipo'}
                </span>
              </button>
            </div>

          </div>
        </form>
      </Modal>

      {/* ── Modal Perfil ── */}
      <Modal
        open={modalPerfil}
        onClose={() => setModalPerfil(false)}
        title="Mis Datos Personales"
        width="440px"
      >
        <form onSubmit={savePerfil} translate="no">
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>DNI *</label>
              <input
                className="input-field"
                value={perfilForm.dni}
                onChange={e => setPerfilForm(p => ({ ...p, dni: e.target.value }))}
                placeholder="38000000"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Ciudad</label>
              <input
                className="input-field"
                value={perfilForm.ciudad}
                onChange={e => setPerfilForm(p => ({ ...p, ciudad: e.target.value }))}
                placeholder="San Salvador de Jujuy"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px' }}>Dirección</label>
              <input
                className="input-field"
                value={perfilForm.direccion}
                onChange={e => setPerfilForm(p => ({ ...p, direccion: e.target.value }))}
                placeholder="Av. Belgrano 1234"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => setModalPerfil(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}