// src/components/common/Modal.jsx
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, width = '540px' }) {
  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         100,
        background:     'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '16px',
        animation:      'fadeIn 0.2s ease',
        overflowY:      'auto',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background:    'var(--bg-card)',
          border:        '1px solid var(--border-light)',
          borderRadius:  '16px',
          width:         '100%',
          maxWidth:      width,
          maxHeight:     '90vh',
          display:       'flex',
          flexDirection: 'column',
          animation:     'fadeInUp 0.25s ease',
          boxShadow:     '0 24px 80px rgba(0,0,0,0.5)',
          margin:        'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding:        '16px 20px',
          borderBottom:   '1px solid var(--border)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            '12px',
          flexShrink:     0,
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background:   'var(--bg-hover)',
              border:       '1px solid var(--border)',
              borderRadius: '8px',
              padding:      '6px',
              cursor:       'pointer',
              color:        'var(--text-muted)',
              display:      'flex',
              transition:   'all 0.15s',
              flexShrink:   0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Contenido */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp  {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Modal full-width en móvil */
        @media (max-width: 600px) {
          .modal-responsive-inner {
            max-width: 100% !important;
            border-radius: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}