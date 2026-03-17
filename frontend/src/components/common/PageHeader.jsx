export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: '24px', flexWrap: 'wrap', gap: '12px'
    }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}