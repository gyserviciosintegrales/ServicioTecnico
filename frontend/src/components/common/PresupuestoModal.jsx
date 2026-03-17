// src/components/common/PresupuestoModal.jsx
import { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const ITEM_VACIO = { descripcion: '', cantidad: 1, precio_unit: '' };

export default function PresupuestoModal({ presupuesto, onClose, onGuardado }) {
  const editando = !!presupuesto;

  const [clientes, setClientes]         = useState([]);
  const [equipos, setEquipos]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [clienteModelId, setClienteModelId] = useState('');
  const [form, setForm] = useState({
    titulo:       '',
    descripcion:  '',
    cliente:      '',   // Usuario ID
    equipo:       '',
    validez_dias: 15,
    condiciones:  '',
  });
  const [items, setItems] = useState([{ ...ITEM_VACIO }]);

  // Cargar datos del presupuesto si estamos editando
  useEffect(() => {
    if (editando) {
      api.get(`/presupuestos/${presupuesto.id}/`).then(({ data }) => {
        setForm({
          titulo:       data.titulo,
          descripcion:  data.descripcion,
          cliente:      data.cliente,
          equipo:       data.equipo || '',
          validez_dias: data.validez_dias,
          condiciones:  data.condiciones,
        });
        setItems(data.items?.length ? data.items.map(i => ({
          descripcion: i.descripcion,
          cantidad:    i.cantidad,
          precio_unit: i.precio_unit,
        })) : [{ ...ITEM_VACIO }]);
      }).catch(() => {});
    }
  }, [editando, presupuesto]);

  // Cargar clientes
  useEffect(() => {
    api.get('/clientes/').then(({ data }) => setClientes(data.results ?? data)).catch(() => {});
  }, []);

  // Cargar equipos cuando cambia el clienteModelId
  useEffect(() => {
    if (clienteModelId) {
      api.get(`/equipos/?cliente_id=${clienteModelId}`)
        .then(({ data }) => setEquipos(data.results ?? data))
        .catch(() => setEquipos([]));
    } else {
      setEquipos([]);
      setForm(f => ({ ...f, equipo: '' }));
    }
  }, [clienteModelId]);

  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Handler especial para el select de cliente
  const handleClienteChange = (e) => {
    const clienteId = e.target.value;
    const clienteObj = clientes.find(c => String(c.id) === String(clienteId));
    const usuarioId = clienteObj
      ? (typeof clienteObj.usuario === 'object' ? clienteObj.usuario?.id : clienteObj.usuario)
      : '';
    setClienteModelId(clienteId);
    setForm(f => ({ ...f, cliente: usuarioId, equipo: '' }));
  };

  const handleItem = (i, field, value) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const addItem    = () => setItems(prev => [...prev, { ...ITEM_VACIO }]);
  const removeItem = (i) => { if (items.length > 1) setItems(prev => prev.filter((_, idx) => idx !== i)); };

  const subtotal = items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precio_unit) || 0), 0);
  const total = subtotal;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim())    { toast.error('El título es obligatorio'); return; }
    if (!form.cliente)          { toast.error('Seleccioná un cliente'); return; }
    if (items.some(i => !i.descripcion.trim() || !i.precio_unit)) {
      toast.error('Completá todos los ítems'); return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        equipo: form.equipo || null,
        items: items.map((it, idx) => ({ ...it, orden_item: idx })),
      };
      let data;
      if (editando) {
        ({ data } = await api.put(`/presupuestos/${presupuesto.id}/`, payload));
      } else {
        ({ data } = await api.post('/presupuestos/', payload));
      }
      toast.success(editando ? 'Presupuesto actualizado' : 'Presupuesto creado');
      onGuardado(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', width: '100%', maxWidth: '680px',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        animation: 'fadeInUp 0.2s ease',
      }}>
        {/* Header modal */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} color="var(--accent-cyan)" />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
              {editando ? `Editar presupuesto #${presupuesto.numero_display}` : 'Nuevo presupuesto'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            {/* Título */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Título *</label>
              <input className="input-field" name="titulo" placeholder="Ej: Reparación placa base notebook"
                value={form.titulo} onChange={handleForm} required />
            </div>

            {/* Cliente */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Cliente *</label>
              <select className="input-field" name="cliente" value={clienteModelId} onChange={handleClienteChange} required>
                <option value="">Seleccioná un cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.usuario_nombre || c.nombre_completo || (typeof c.usuario === 'object' ? c.usuario?.first_name + ' ' + c.usuario?.last_name : `Cliente ${c.id}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Equipo */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Equipo (opcional)</label>
              <select className="input-field" name="equipo" value={form.equipo} onChange={handleForm} disabled={!form.cliente}>
                <option value="">Sin equipo asociado</option>
                {equipos.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.tipo} {eq.marca} {eq.modelo}</option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Descripción del trabajo</label>
              <textarea className="input-field" name="descripcion" rows={2}
                placeholder="Detallá el trabajo a realizar..."
                value={form.descripcion} onChange={handleForm}
                style={{ resize: 'vertical', lineHeight: '1.4' }} />
            </div>

            {/* Validez */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Validez (días)</label>
              <input className="input-field" type="number" name="validez_dias" min="1"
                value={form.validez_dias} onChange={handleForm} />
            </div>
          </div>

          {/* ── Ítems ── */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Ítems *</label>
              <button type="button" onClick={addItem} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)',
                borderRadius: '7px', padding: '5px 10px', cursor: 'pointer',
                color: 'var(--accent-cyan)', fontSize: '12px', fontWeight: '600',
                fontFamily: 'Space Grotesk, sans-serif',
              }}>
                <Plus size={13} /> Agregar ítem
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Header ítems */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 30px', gap: '8px', padding: '0 4px' }}>
                {['Descripción', 'Cant.', 'Precio unit.', ''].map(h => (
                  <span key={h} style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>

              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 30px', gap: '8px', alignItems: 'center' }}>
                  <input className="input-field" placeholder="Descripción del ítem"
                    value={item.descripcion} onChange={e => handleItem(i, 'descripcion', e.target.value)}
                    required style={{ fontSize: '13px' }} />
                  <input className="input-field" type="number" min="0.01" step="0.01" placeholder="1"
                    value={item.cantidad} onChange={e => handleItem(i, 'cantidad', e.target.value)}
                    style={{ fontSize: '13px', textAlign: 'center' }} />
                  <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00"
                    value={item.precio_unit} onChange={e => handleItem(i, 'precio_unit', e.target.value)}
                    required style={{ fontSize: '13px', textAlign: 'right' }} />
                  <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} style={{
                    background: 'transparent', border: 'none', cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                    color: items.length === 1 ? 'var(--bg-hover)' : '#ef4444', display: 'flex', padding: '4px',
                    transition: 'color 0.15s',
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Resumen totales */}
            <div style={{ marginTop: '12px', padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Subtotal</span>
                <span style={{ fontSize: '12px' }}>${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700' }}>Total</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                  ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Condiciones */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Condiciones / garantía (opcional)</label>
            <textarea className="input-field" name="condiciones" rows={2}
              placeholder="Ej: Garantía de 3 meses en mano de obra. Repuestos sin garantía de fábrica."
              value={form.condiciones} onChange={handleForm}
              style={{ resize: 'vertical', fontSize: '13px', lineHeight: '1.4' }} />
          </div>
        </form>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{
            padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
            fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: '600',
          }}>
            Cancelar
          </button>
          <button onClick={submit} disabled={loading} className="btn-primary" style={{
            display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px', fontSize: '13px',
          }}>
            {loading
              ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#080c14', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Guardando...</>
              : editando ? 'Guardar cambios' : 'Crear presupuesto'
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}