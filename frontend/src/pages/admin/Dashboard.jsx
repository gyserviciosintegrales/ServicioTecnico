import { useEffect, useState } from 'react';
import { 
  Users, Monitor, ClipboardList, DollarSign, TrendingUp, 
  Clock, Activity, PlusCircle, UserPlus, Laptop, 
  FileSearch, ArrowUpRight, AlertCircle 
} from 'lucide-react';
import { getEstadisticas } from '../../api/auth';
import { getClientes } from '../../api/clientes';
import { getEquipos } from '../../api/equipos';
import { getOrdenes } from '../../api/ordenes';
import { ESTADOS_CONFIG, StatusBadge, PagoBadge } from '../../components/common/StatusBadge';
import { useNavigate } from 'react-router-dom';

const QuickAction = ({ icon: Icon, label, color, onClick }) => (
  <button 
    onClick={onClick}
    className="quick-action-btn"
    style={{
      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px', color: 'var(--text-primary)', cursor: 'pointer',
      transition: 'all 0.2s ease', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap'
    }}
  >
    <Icon size={14} color={color} />
    <span>{label}</span>
  </button>
);

const StatCard = ({ icon: Icon, label, value, color, sub, loading }) => (
  <div className="compact-card" style={{ 
    padding: '14px', borderRadius: '16px',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
    border: '1px solid rgba(255,255,255,0.06)', position: 'relative'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
      <div style={{ padding: '6px', borderRadius: '8px', background: `${color}15` }}>
        <Icon size={16} color={color} />
      </div>
      {sub && <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '800' }}>{sub}</span>}
    </div>
    {loading ? (
      <div style={{ height: '20px', width: '50%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
    ) : (
      <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    )}
    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [counts, setCounts] = useState({ clientes: 0, equipos: 0, noCobradas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [stRes, cRes, eRes, oRes] = await Promise.all([
          getEstadisticas(), getClientes(), getEquipos({}), getOrdenes({ ordering: '-fecha_creacion' })
        ]);

        const dataOrdenes = oRes.data.results ?? oRes.data;
        // Calculamos manualmente las no cobradas basándonos en el campo 'pagado'
        const noCobradas = dataOrdenes.filter(o => !o.pagado).length;

        setStats(stRes.data);
        setCounts({
          clientes: (cRes.data.results ?? cRes.data).length,
          equipos:  (eRes.data.results ?? eRes.data).length,
          noCobradas: noCobradas
        });
        setOrdenes(dataOrdenes.slice(0, 6));
      } catch (error) {
        console.error("Error cargando dashboard", error);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div style={{ maxWidth: '100%', animation: 'fadeIn 0.4s ease', paddingBottom: '20px' }}>
      
      {/* HEADER & ACCESOS DIRECTOS */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>Panel General</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10b981', fontWeight: '700' }}>
            <Activity size={12} /> <span style={{ letterSpacing: '0.5px' }}>SISTEMA ACTIVO</span>
          </div>
        </div>

        <div style={{ 
          display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px',
          scrollbarWidth: 'none', msOverflowStyle: 'none' 
        }}>
          <QuickAction icon={PlusCircle} label="Nueva Orden" color="#06b6d4" onClick={() => navigate('/admin/ordenes/nueva')} />
          <QuickAction icon={UserPlus} label="Nuevo Cliente" color="#8b5cf6" onClick={() => navigate('/admin/clientes')} />
          <QuickAction icon={FileSearch} label="Buscar" color="#10b981" onClick={() => navigate('/admin/ordenes')} />
        </div>
      </div>

      {/* STATS GRID - 2 FILAS EN MÓVIL POR DEFECTO */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
        gap: '10px', marginBottom: '16px' 
      }}>
        <StatCard loading={loading} icon={Users} label="Clientes" color="#06b6d4" value={counts.clientes} />
        <StatCard loading={loading} icon={Monitor} label="Equipos" color="#8b5cf6" value={counts.equipos} />
        <StatCard loading={loading} icon={ClipboardList} label="Órdenes" color="#10b981" value={stats?.total_ordenes ?? 0} sub="Global" />
        <StatCard loading={loading} icon={DollarSign} label="Este Mes" color="#10b981" value={`$${(stats?.cobrado_mes ?? 0).toLocaleString('es-AR')}`} sub="Caja" />
      </div>

      {/* CONTENIDO PRINCIPAL COMPACTO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px', alignItems: 'start' }}>
        
        {/* TABLA DENSIDAD ALTA */}
        <div style={{ 
          background: 'var(--bg-secondary)', borderRadius: '16px', 
          border: '1px solid var(--border)', overflow: 'hidden' 
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '800', fontSize: '12px', color: 'var(--text-muted)' }}>MOVIMIENTOS RECIENTES</span>
            <ArrowUpRight size={14} color="var(--text-muted)" />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)' }}>
                  {['ID', 'Cliente', 'Estado', 'Monto'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenes.map(o => (
                  <tr key={o.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 14px', fontWeight: '800', color: '#06b6d4' }}>#{String(o.id).slice(-4)}</td>
                    <td style={{ padding: '8px 14px', fontWeight: '600', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.cliente_nombre}</td>
                    <td style={{ padding: '8px 14px' }}><StatusBadge estado={o.estado} /></td>
                    <td style={{ padding: '8px 14px', fontWeight: '700' }}>${Math.round(o.total ?? 0).toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* MINI BANNER DINÁMICO CORREGIDO */}
          <div style={{ 
            padding: '12px', borderRadius: '14px', 
            background: counts.noCobradas > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
            border: `1px solid ${counts.noCobradas > 0 ? '#ef4444' : '#10b981'}`,
            display: 'flex', gap: '10px', alignItems: 'flex-start'
          }}>
            <AlertCircle size={18} color={counts.noCobradas > 0 ? '#ef4444' : '#10b981'} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Estado de Cobros</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {counts.noCobradas > 0 
                  ? `Tienes ${counts.noCobradas} órdenes sin cobrar en el sistema.` 
                  : 'Todas las órdenes recientes están al día.'}
              </p>
            </div>
          </div>

          {/* DISTRIBUCIÓN */}
          <div style={{ 
            background: 'var(--bg-secondary)', borderRadius: '16px', 
            border: '1px solid var(--border)', padding: '14px' 
          }}>
            <span style={{ fontWeight: '800', fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>ESTADOS EN TALLER</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(ESTADOS_CONFIG).map(([key, cfg]) => {
                const cant = stats?.por_estado?.[key] ?? 0;
                const pct = (cant / (stats?.total_ordenes || 1)) * 100;
                if (cant === 0) return null;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: '700' }}>{cfg.label}</span>
                      <span style={{ fontWeight: '800', color: cfg.color }}>{cant}</span>
                    </div>
                    <div style={{ height: '3px', background: 'var(--bg-hover)', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: cfg.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .quick-action-btn:hover { background: rgba(255,255,255,0.08) !important; transform: translateY(-1px); }
        .row-hover:hover { background: var(--bg-hover); }
        ::-webkit-scrollbar { display: none; }
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 1fr 280px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}