import { useEffect, useState } from 'react';
import { Users, Monitor, ClipboardList, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getEstadisticas } from '../../api/auth';
import { getClientes } from '../../api/clientes';
import { getEquipos } from '../../api/equipos';
import { getOrdenes } from '../../api/ordenes';
import { ESTADOS_CONFIG, StatusBadge, PagoBadge } from '../../components/common/StatusBadge';

const StatCard = ({ icon: Icon, label, value, color, sub, loading }) => (
  <div className="card" style={{ padding: '22px', animation: 'fadeInUp 0.4s ease' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
    </div>
    {loading
      ? <div style={{ height: '32px', borderRadius: '6px', background: 'var(--bg-hover)', animation: 'pulse 1.5s infinite', marginBottom: '6px' }} />
      : <div style={{ fontSize: '30px', fontWeight: '800', marginBottom: '4px', fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    }
    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</div>
    {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [counts, setCounts] = useState({ clientes: 0, equipos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [stRes, cRes, eRes, oRes] = await Promise.all([
          getEstadisticas(),
          getClientes(),
          getEquipos({}),
          getOrdenes({ ordering: '-fecha_creacion' })
        ]);
        setStats(stRes.data);
        setCounts({
          clientes: (cRes.data.results ?? cRes.data).length,
          equipos:  (eRes.data.results ?? eRes.data).length,
        });
        setOrdenes((oRes.data.results ?? oRes.data).slice(0, 10));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const porEstado = stats?.por_estado ?? {};

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard loading={loading} icon={Users}         label="Clientes registrados"  color="#06b6d4" value={counts.clientes} />
        <StatCard loading={loading} icon={Monitor}       label="Equipos en sistema"    color="#8b5cf6" value={counts.equipos} />
        <StatCard loading={loading} icon={ClipboardList} label="Órdenes totales"       color="#10b981" value={stats?.total_ordenes ?? 0} sub={`${stats?.en_proceso ?? 0} en proceso`} />
        <StatCard loading={loading} icon={Clock}         label="Listas para retirar"   color="#f59e0b" value={stats?.listas ?? 0} />
        <StatCard loading={loading} icon={AlertCircle}   label="Pendientes de cobro"   color="#ef4444" value={stats?.pendientes_pago ?? 0} />
        <StatCard loading={loading} icon={DollarSign}    label="Cobrado este mes"      color="#10b981"
          value={loading ? '...' : `$${(stats?.cobrado_mes ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`}
          sub={`Total: $${(stats?.total_cobrado ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
        {/* Tabla órdenes recientes */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={15} color="#06b6d4" />
            <span style={{ fontWeight: '600', fontSize: '15px' }}>Órdenes Recientes</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Cliente', 'Equipo', 'Estado', 'Total', 'Pago'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} style={{ padding: '13px 14px' }}>
                            <div style={{ height: '11px', borderRadius: '4px', background: 'var(--bg-hover)', width: `${40 + Math.random() * 50}%`, animation: 'pulse 1.5s infinite' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : ordenes.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="mono" style={{ fontSize: '12px', color: '#06b6d4', fontWeight: '700' }}>#{String(o.id).padStart(4,'0')}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '500' }}>{o.cliente_nombre}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {o.equipo_detalle?.tipo_display} — {o.equipo_detalle?.marca}
                      </td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge estado={o.estado} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="mono" style={{ fontSize: '12px', fontWeight: '700' }}>
                          ${parseFloat(o.total ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}><PagoBadge pagado={o.pagado} /></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribución por estado */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={15} color="#8b5cf6" />
            <span style={{ fontWeight: '600', fontSize: '15px' }}>Por Estado</span>
          </div>
          <div style={{ padding: '12px' }}>
            {Object.entries(ESTADOS_CONFIG).map(([key, cfg]) => {
              const cant = porEstado[key] ?? 0;
              const total = stats?.total_ordenes ?? 1;
              const pct = Math.round((cant / total) * 100);
              return (
                <div key={key} style={{ padding: '8px 8px', borderRadius: '8px', marginBottom: '4px', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{cfg.label}</span>
                    <span className="mono" style={{ fontSize: '12px', fontWeight: '700', color: cfg.color }}>{cant}</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '2px', background: 'var(--bg-hover)' }}>
                    <div style={{ height: '100%', borderRadius: '2px', background: cfg.color, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}