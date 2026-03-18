// src/components/common/CambiarRolModal.jsx
import { useState } from 'react';
import { Shield, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const ROLES = [
  { value: 'admin',    label: 'Administrador', color: '#06b6d4',  desc: 'Acceso total al sistema' },
  { value: 'tecnico',  label: 'Técnico',        color: '#8b5cf6',  desc: 'Gestiona órdenes asignadas' },
  { value: 'cliente',  label: 'Cliente',        color: '#10b981',  desc: 'Ve sus equipos y órdenes' },
];

export default function CambiarRolModal({ usuario, onClose, onActualizado }) {
  const [rolSeleccionado, setRolSeleccionado] = useState(usuario.rol);
  const [loading, setLoading] = useState(false);

  const guardar = async () => {
    if (rolSeleccionado === usuario.rol) { onClose(); return; }
    setLoading(true);
    try {
      const { data } = await api.patch(`/auth/usuarios/${usuario.id}/cambiar_rol/`, {
        rol: rolSeleccionado,
      });
      toast.success(data.mensaje);
      onActualizado({ ...usuario, rol: rolSeleccionado });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar el rol');
    } finally { setLoading(false); }
  };

  const nombre = usuario.first_name
    ? `${usuario.first_name} ${usuario.last_name}`.trim()
    : usuario.username;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', width: '100%', maxWidth: '420px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        animation: 'fadeInUp 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} color="var(--accent-cyan)" />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Cambiar rol</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{nombre}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Opciones */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => setRolSeleccionado(r.value)} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
              border: `1px solid ${rolSeleccionado === r.value ? r.color + '50' : 'var(--border)'}`,
              background: rolSeleccionado === r.value ? `${r.color}10` : 'var(--bg-secondary)',
              textAlign: 'left', width: '100%', transition: 'all 0.15s',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: rolSeleccionado === r.value ? r.color : 'var(--text-primary)', margin: 0 }}>{r.label}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{r.desc}</p>
              </div>
              {rolSeleccionado === r.value && (
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: '700' }}>✓</span>
                </div>
              )}
            </button>
          ))}

          {/* Advertencia si intenta quitar el admin de sí mismo */}
          <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', marginTop: '4px' }}>
            <p style={{ fontSize: '11px', color: '#f59e0b', margin: 0, lineHeight: '1.5' }}>
              ⚠️ No podés cambiar tu propio rol ni dejar el sistema sin administradores.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
            fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px',
          }}>Cancelar</button>
          <button onClick={guardar} disabled={loading || rolSeleccionado === usuario.rol} className="btn-primary" style={{
            padding: '9px 20px', fontSize: '13px',
            opacity: rolSeleccionado === usuario.rol ? 0.5 : 1,
          }}>
            {loading ? 'Guardando...' : 'Guardar cambio'}
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}