// src/components/common/HistorialOrden.jsx
import { useEffect, useState } from 'react';
import { Clock, User, ArrowRight } from 'lucide-react';
import api from '../../api/axios';

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

export default function HistorialOrden({ ordenId, visible }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (!visible || !ordenId) return;
    setLoading(true);
    api.get(`/ordenes/${ordenId}/historial/`)
      .then(({ data }) => setHistorial(data))
      .catch(err => console.error('Error cargando historial:', err))
      .finally(() => setLoading(false));
  }, [visible, ordenId]);

  if (!visible) return null;

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      padding: '20px',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '16px',
      }}>
        <Clock size={15} color="#06b6d4" />
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
          Historial de cambios
        </span>
        <span style={{
          fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
          background: 'rgba(6,182,212,0.1)', color: '#06b6d4',
          border: '1px solid rgba(6,182,212,0.2)',
        }}>
          {historial.length} entrada{historial.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            border: '2px solid var(--border)', borderTopColor: '#06b6d4',
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      ) : historial.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
          Sin cambios registrados aún
        </p>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Línea vertical del timeline */}
          <div style={{
            position: 'absolute', left: '15px', top: '8px',
            bottom: '8px', width: '1px',
            background: 'linear-gradient(to bottom, var(--border), transparent)',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historial.map((entrada, idx) => {
              const color = CAMPO_COLORS[entrada.campo] ?? '#64748b';
              const icon  = CAMPO_ICONS[entrada.campo]  ?? '📋';
              return (
                <div
                  key={entrada.id}
                  style={{
                    display: 'flex', gap: '14px', alignItems: 'flex-start',
                    animation: `fadeInUp 0.3s ease ${idx * 0.04}s both`,
                  }}
                >
                  {/* Dot del timeline */}
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                    background: `${color}15`, border: `1px solid ${color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', zIndex: 1, marginTop: '2px',
                  }}>
                    {icon}
                  </div>

                  {/* Contenido */}
                  <div style={{
                    flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '12px 14px',
                  }}>
                    {/* Cabecera */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', marginBottom: '6px',
                      flexWrap: 'wrap', gap: '6px',
                    }}>
                      <span style={{
                        fontSize: '12px', fontWeight: '700',
                        color, padding: '2px 8px', borderRadius: '6px',
                        background: `${color}12`, border: `1px solid ${color}25`,
                      }}>
                        {entrada.campo_display}
                      </span>
                      <span style={{
                        fontSize: '11px', color: 'var(--text-muted)',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}>
                        {entrada.fecha}
                      </span>
                    </div>

                    {/* Cambio anterior → nuevo */}
                    {entrada.valor_anterior !== null && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        marginBottom: '6px', flexWrap: 'wrap',
                      }}>
                        <span style={{
                          fontSize: '12px', color: 'var(--text-muted)',
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.15)',
                          padding: '2px 8px', borderRadius: '5px',
                          textDecoration: 'line-through',
                        }}>
                          {entrada.valor_anterior || '—'}
                        </span>
                        <ArrowRight size={12} color="var(--text-muted)" />
                        <span style={{
                          fontSize: '12px', fontWeight: '600',
                          background: `${color}12`,
                          border: `1px solid ${color}25`,
                          color, padding: '2px 8px', borderRadius: '5px',
                        }}>
                          {entrada.valor_nuevo || '—'}
                        </span>
                      </div>
                    )}

                    {/* Usuario */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={11} color="var(--text-muted)" />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {entrada.usuario_nombre}
                      </span>
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