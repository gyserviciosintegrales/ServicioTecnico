import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid var(--border)' }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '7px', padding: '7px', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? 'var(--text-muted)' : 'var(--text-secondary)', display: 'flex', opacity: page === 1 ? 0.4 : 1 }}>
        <ChevronLeft size={14} />
      </button>

      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        let p;
        if (totalPages <= 7) p = i + 1;
        else if (page <= 4) p = i + 1;
        else if (page >= totalPages - 3) p = totalPages - 6 + i;
        else p = page - 3 + i;

        return (
          <button key={p} onClick={() => onChange(p)} style={{
            width: '32px', height: '32px', borderRadius: '7px', border: '1px solid',
            borderColor: p === page ? 'rgba(6,182,212,0.4)' : 'var(--border)',
            background: p === page ? 'rgba(6,182,212,0.1)' : 'var(--bg-hover)',
            color: p === page ? '#06b6d4' : 'var(--text-secondary)',
            fontWeight: p === page ? '700' : '400',
            cursor: 'pointer', fontSize: '13px', fontFamily: 'Space Grotesk, sans-serif',
            transition: 'all 0.15s'
          }}>
            {p}
          </button>
        );
      })}

      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '7px', padding: '7px', cursor: page === totalPages ? 'default' : 'pointer', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', display: 'flex', opacity: page === totalPages ? 0.4 : 1 }}>
        <ChevronRight size={14} />
      </button>

      <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>
        Pág. {page} de {totalPages}
      </span>
    </div>
  );
}