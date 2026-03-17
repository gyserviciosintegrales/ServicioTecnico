import { Edit2, Trash2, FileText, Eye } from 'lucide-react';

const BTN = ({ onClick, icon: Icon, hoverColor, title, disabled, loading }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      background: 'var(--bg-hover)', border: '1px solid var(--border)',
      borderRadius: '7px', padding: '6px', cursor: disabled ? 'default' : 'pointer',
      color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.15s',
      opacity: disabled ? 0.5 : 1
    }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = hoverColor; e.currentTarget.style.color = hoverColor; }}}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
  >
    {loading
      ? <div style={{ width: '13px', height: '13px', border: '2px solid var(--text-muted)', borderTopColor: hoverColor, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      : <Icon size={13} />
    }
  </button>
);

export function EditButton({ onClick })  { return <BTN onClick={onClick} icon={Edit2}     hoverColor="#06b6d4" title="Editar" />; }
export function DeleteButton({ onClick }) { return <BTN onClick={onClick} icon={Trash2}    hoverColor="#ef4444" title="Eliminar" />; }
export function ViewButton({ onClick })  { return <BTN onClick={onClick} icon={Eye}       hoverColor="#8b5cf6" title="Ver detalle" />; }
export function PdfButton({ onClick, loading }) {
  return <BTN onClick={onClick} icon={FileText} hoverColor="#8b5cf6" title="Descargar PDF" disabled={loading} loading={loading} />;
}
export function ActionGroup({ children }) {
  return <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>{children}</div>;
}