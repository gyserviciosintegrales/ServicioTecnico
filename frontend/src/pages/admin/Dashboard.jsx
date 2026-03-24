// src/pages/admin/Dashboard.jsx
import { useEffect, useState } from 'react';
import {
  Users, Monitor, ClipboardList, DollarSign,
  Activity, PlusCircle, UserPlus, FileSearch,
  AlertCircle, TrendingUp, CheckCircle, Clock,
} from 'lucide-react';
import { getEstadisticas } from '../../api/auth';
import { getClientes } from '../../api/clientes';
import { getEquipos } from '../../api/equipos';
import { getOrdenes } from '../../api/ordenes';
import { ESTADOS_CONFIG, StatusBadge } from '../../components/common/StatusBadge';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats]   = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [counts, setCounts] = useState({ clientes: 0, equipos: 0, noCobradas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [stRes, cRes, eRes, oRes] = await Promise.all([
          getEstadisticas(), getClientes(), getEquipos({}),
          getOrdenes({ ordering: '-fecha_creacion' }),
        ]);
        const dataOrdenes = oRes.data.results ?? oRes.data;
        setStats(stRes.data);
        setCounts({
          clientes:   (cRes.data.results ?? cRes.data).length,
          equipos:    (eRes.data.results ?? eRes.data).length,
          noCobradas: dataOrdenes.filter(o => !o.pagado).length,
        });
        setOrdenes(dataOrdenes.slice(0, 8));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const STAT_CARDS = [
    { icon: Users,         label: 'Clientes',     value: counts.clientes,                          color: '#06b6d4' },
    { icon: Monitor,       label: 'Equipos',       value: counts.equipos,                           color: '#8b5cf6' },
    { icon: ClipboardList, label: 'Órdenes total', value: stats?.total_ordenes ?? 0,               color: '#10b981' },
    { icon: Clock,         label: 'En proceso',    value: stats?.en_proceso ?? 0,                   color: '#f59e0b' },
    { icon: CheckCircle,   label: 'Listas',        value: stats?.listas ?? 0,                       color: '#10b981' },
    { icon: DollarSign,    label: 'Cobrado mes',   value: `$${(stats?.cobrado_mes ?? 0).toLocaleString('es-AR')}`, color: '#10b981' },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.35s ease', paddingBottom: '24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px' }}>Panel General</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
            <Activity size={12} /> SISTEMA ACTIVO
          </div>
        </div>

        {/* Accesos rápidos */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { icon: PlusCircle, label: 'Nueva Orden',    color: '#06b6d4', to: '/admin/ordenes' },
            { icon: UserPlus,   label: 'Nuevo Cliente',  color: '#8b5cf6', to: '/admin/clientes' },
            { icon: FileSearch, label: 'Ver Órdenes',    color: '#10b981', to: '/admin/ordenes' },
          ].map(({ icon: Icon, label, color, to }) => (
            <button key={label} onClick={() => navigate(to)} style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 14px', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: '10px',
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600', fontFamily: 'Space Grotesk, sans-serif',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'none'; }}
            >
              <Icon size={14} color={color} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '12px', marginBottom: '20px',
      }}>
        {STAT_CARDS.map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '14px', padding: '16px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color + '50'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: color + '15', border: `1px solid ${color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '10px',
            }}>
              <Icon size={16} color={color} />
            </div>
            {loading
              ? <div style={{ height: '24px', width: '60%', background: 'var(--bg-hover)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
              : <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '2px', fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
            }
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Contenido principal ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 300px',
        gap: '16px', alignItems: 'start',
      }} className="dashboard-grid">

        {/* Tabla ordenes recientes */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <span style={{ fontWeight: '700', fontSize: '13px' }}>Movimientos recientes</span>
            <button onClick={() => navigate('/admin/ordenes')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: '600',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>
              Ver todos →
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '400px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {['#', 'Cliente', 'Equipo', 'Estado', 'Total'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      {[1,2,3,4,5].map(j => (
                        <td key={j} style={{ padding: '12px 16px' }}>
                          <div style={{ height: '14px', background: 'var(--bg-hover)', borderRadius: '4px', animation: 'pulse 1.5s infinite', width: j === 1 ? '40px' : j === 3 ? '80px' : '100%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                  : ordenes.map(o => (
                    <tr key={o.id} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate('/admin/ordenes')}
                    >
                      <td style={{ padding: '11px 16px', fontWeight: '700', color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                        #{String(o.id).padStart(4,'0')}
                      </td>
                      <td style={{ padding: '11px 16px', fontWeight: '600', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.cliente_nombre}
                      </td>
                      <td style={{ padding: '11px 16px', color: 'var(--text-muted)', fontSize: '12px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.equipo_detalle?.marca} {o.equipo_detalle?.modelo}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <StatusBadge estado={o.estado} />
                      </td>
                      <td style={{ padding: '11px 16px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        ${Math.round(o.total ?? 0).toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Alerta cobros */}
          <div style={{
            padding: '14px 16px', borderRadius: '12px',
            background: counts.noCobradas > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
            border: `1px solid ${counts.noCobradas > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
            display: 'flex', gap: '12px', alignItems: 'flex-start',
          }}>
            <AlertCircle size={18} color={counts.noCobradas > 0 ? '#ef4444' : '#10b981'} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ margin: '0 0 3px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estado de cobros</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {counts.noCobradas > 0
                  ? `${counts.noCobradas} orden${counts.noCobradas !== 1 ? 'es' : ''} sin cobrar`
                  : 'Todas las órdenes al día ✓'}
              </p>
            </div>
          </div>

          {/* Distribución estados */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
            <p style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>
              Estados en taller
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(ESTADOS_CONFIG).map(([key, cfg]) => {
                const cant = stats?.por_estado?.[key] ?? 0;
                const pct  = Math.round((cant / (stats?.total_ordenes || 1)) * 100);
                if (cant === 0) return null;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{cfg.label}</span>
                      <span style={{ fontWeight: '700', color: cfg.color }}>{cant}</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-hover)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: '999px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
              {!stats && !loading && <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>Sin datos</p>}
            </div>
          </div>

          {/* Ingresos */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
            <p style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Ingresos</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Total cobrado', value: stats?.total_cobrado ?? 0, color: '#10b981' },
                { label: 'Este mes',      value: stats?.cobrado_mes ?? 0,   color: '#06b6d4' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px', fontWeight: '600', textTransform: 'uppercase' }}>{label}</p>
                  {loading
                    ? <div style={{ height: '18px', background: 'var(--bg-hover)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                    : <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color, fontFamily: 'JetBrains Mono, monospace' }}>
                        ${value.toLocaleString('es-AR')}
                      </p>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          div[style*="minmax(160px"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}