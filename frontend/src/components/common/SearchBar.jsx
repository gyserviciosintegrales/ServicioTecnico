import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Buscar...', width = '240px' }) {
  return (
    <div style={{ position: 'relative' }}>
      <Search size={14} style={{
        position: 'absolute', left: '12px', top: '50%',
        transform: 'translateY(-50%)', color: 'var(--text-muted)'
      }} />
      <input
        className="input-field"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ paddingLeft: '36px', paddingRight: value ? '36px' : '12px', width }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{
          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
          display: 'flex', padding: '2px'
        }}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}