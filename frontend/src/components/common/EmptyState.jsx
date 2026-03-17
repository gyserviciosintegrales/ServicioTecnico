export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 20px', color: 'var(--text-muted)'
    }}>
      <div style={{
        width: '60px', height: '60px', borderRadius: '16px',
        background: 'var(--bg-hover)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
      }}>
        <Icon size={26} />
      </div>
      <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>{title}</p>
      <p style={{ fontSize: '13px' }}>{subtitle}</p>
    </div>
  );
}