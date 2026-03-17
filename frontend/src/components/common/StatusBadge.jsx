const ESTADOS_CONFIG = {
  ingresado:          { label: 'Ingresado',           color: '#06b6d4' },
  diagnostico:        { label: 'En Diagnóstico',       color: '#8b5cf6' },
  en_reparacion:      { label: 'En Reparación',        color: '#f59e0b' },
  esperando_repuesto: { label: 'Esperando Repuesto',   color: '#f97316' },
  listo:              { label: 'Listo para Retirar',   color: '#10b981' },
  entregado:          { label: 'Entregado',            color: '#94a3b8' },
  sin_reparacion:     { label: 'Sin Reparación',       color: '#ef4444' },
};

export function StatusBadge({ estado }) {
  const cfg = ESTADOS_CONFIG[estado] ?? { label: estado, color: '#94a3b8' };
  return (
    <span style={{
      fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '600',
      background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30`,
      whiteSpace: 'nowrap'
    }}>
      {cfg.label}
    </span>
  );
}

export function PagoBadge({ pagado }) {
  return (
    <span style={{
      fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '600',
      background: pagado ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      color: pagado ? '#10b981' : '#ef4444',
      border: `1px solid ${pagado ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
      whiteSpace: 'nowrap'
    }}>
      {pagado ? '✓ Pagado' : '✗ Pendiente'}
    </span>
  );
}

export { ESTADOS_CONFIG };