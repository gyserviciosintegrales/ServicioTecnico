// src/pages/cliente/MisOrdenes.jsx
import { useEffect, useState } from 'react';
import { ClipboardList, Shield, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/axios';   // ← faltaba este import

const ESTADOS = [
  { value: 'ingresado',          label: 'Ingresado',           color: '#06b6d4' },
  { value: 'diagnostico',        label: 'En Diagnóstico',       color: '#8b5cf6' },
  { value: 'en_reparacion',      label: 'En Reparación',        color: '#f59e0b' },
  { value: 'esperando_repuesto', label: 'Esperando Repuesto',   color: '#f97316' },
  { value: 'listo',              label: 'Listo para Retirar',   color: '#10b981' },
  { value: 'entregado',          label: 'Entregado',            color: '#94a3b8' },
  { value: 'sin_reparacion',     label: 'Sin Reparación',       color: '#ef4444' },
];

export default function MisOrdenes() {
  const [ordenes, setOrdenes]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    api.get('/ordenes/')
      .then(({ data }) => setOrdenes(data.results ?? data))
      .catch(err => console.error('Error cargando órdenes:', err))
      .finally(() => setLoading(false));
  }, []);

  const getEst = (v) => ESTADOS.find(e => e.value === v) ?? ESTADOS[0];

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
          Estado de Mis Reparaciones
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          {ordenes.length} reparación{ordenes.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            border: '2px solid var(--border)', borderTopColor: '#06b6d4',
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      ) : ordenes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="Sin reparaciones"
            subtitle="Cuando traigas un equipo al taller, verás el estado aquí"
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ordenes.map(o => {
            const est  = getEst(o.estado);
            const open = expandido === o.id;
            const listo = o.estado === 'listo' || o.estado === 'entregado';
            const pasos = ['ingresado','diagnostico','en_reparacion','esperando_repuesto','listo','entregado'];
            const pct   = Math.round(((pasos.indexOf(o.estado) + 1) / pasos.length) * 100);

            return (
              <div
                key={o.id}
                className="card"
                style={{ overflow: 'hidden', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${est.color}40`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {/* Barra progreso */}
                <div style={{ height: '3px', background: 'var(--bg-hover)' }}>
                  <div style={{
                    height: '100%', background: est.color,
                    width: `${pct}%`, transition: 'width 0.6s ease',
                    borderRadius: '0 3px 3px 0',
                  }} />
                </div>

                {/* Header */}
                <div
                  style={{
                    padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '12px',
                  }}
                  onClick={() => setExpandido(open ? null : o.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{
                        fontSize: '18px', fontWeight: '800', color: est.color,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}>
                        #{String(o.id).padStart(4, '0')}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(o.fecha_ingreso).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontWeight: '600', fontSize: '14px', marginBottom: '3px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {o.equipo_detalle?.tipo_display} — {o.equipo_detalle?.marca} {o.equipo_detalle?.modelo}
                      </div>
                      <div style={{
                        fontSize: '12px', color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {o.problema_reportado}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '12px', padding: '4px 12px', borderRadius: '999px',
                      fontWeight: '600', background: `${est.color}18`,
                      color: est.color, border: `1px solid ${est.color}30`,
                    }}>
                      {est.label}
                    </span>
                    {open
                      ? <ChevronUp size={16} color="var(--text-muted)" />
                      : <ChevronDown size={16} color="var(--text-muted)" />
                    }
                  </div>
                </div>

                {/* Detalle expandido */}
                {open && (
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    padding: '16px 20px', animation: 'fadeIn 0.2s ease',
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px', marginBottom: '16px',
                    }}>
                      {o.diagnostico && (
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Diagnóstico
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {o.diagnostico}
                          </p>
                        </div>
                      )}
                      {o.solucion_aplicada && (
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Solución
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {o.solucion_aplicada}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Costo / Pago / Garantía */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '10px',
                    }}>
                      <div style={{
                        padding: '12px 14px', borderRadius: '8px',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', gap: '10px',
                      }}>
                        <DollarSign size={16} color="#10b981" />
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Costo total</div>
                          <div style={{
                            fontSize: '16px', fontWeight: '700', color: '#10b981',
                            fontFamily: 'JetBrains Mono, monospace',
                          }}>
                            ${parseFloat(o.total ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        padding: '12px 14px', borderRadius: '8px',
                        background: o.pagado ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                        border: `1px solid ${o.pagado ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          Estado de pago
                        </div>
                        <div style={{
                          fontSize: '14px', fontWeight: '700',
                          color: o.pagado ? '#10b981' : '#ef4444',
                        }}>
                          {o.pagado ? '✓ Pagado' : '✗ Pendiente'}
                        </div>
                      </div>

                      {o.meses_garantia > 0 && listo && (
                        <div style={{
                          padding: '12px 14px', borderRadius: '8px',
                          background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)',
                          display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                          <Shield size={16} color="#06b6d4" />
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Garantía</div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#06b6d4' }}>
                              {o.meses_garantia} mes{o.meses_garantia !== 1 ? 'es' : ''}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {listo && (
                      <div style={{
                        marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
                        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                        fontSize: '13px', color: '#10b981', fontWeight: '500',
                      }}>
                        🎉 ¡Tu equipo está listo! Podés pasar a retirarlo por el taller.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}