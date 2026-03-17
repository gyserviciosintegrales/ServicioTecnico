// src/components/common/PWAInstallPrompt.jsx
// Muestra un banner de instalación cuando el navegador lo permite
import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [prompt, setPrompt]     = useState(null);
  const [visible, setVisible]   = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // Capturar el evento de instalación del navegador
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      // Mostrar el banner después de 3 segundos
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const instalar = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setVisible(false);
    setPrompt(null);
  };

  if (!visible || installed || !prompt) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999,
      background: '#111827',
      border: '1px solid rgba(6,182,212,0.3)',
      borderRadius: '14px',
      padding: '14px 18px',
      width: 'calc(100% - 32px)',
      maxWidth: '380px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', gap: '12px',
      animation: 'slideUp 0.3s ease',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
        background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Smartphone size={20} color="#06b6d4" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#f0f6fc', margin: '0 0 2px' }}>
          Instalá la app
        </p>
        <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
          Accedé más rápido desde tu pantalla de inicio
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={instalar} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '7px 12px', borderRadius: '8px', border: 'none',
          background: '#06b6d4', color: '#080c14',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '12px', fontWeight: '700', cursor: 'pointer',
        }}>
          <Download size={13} /> Instalar
        </button>
        <button onClick={() => setVisible(false)} style={{
          background: 'transparent', border: 'none',
          cursor: 'pointer', color: '#64748b', display: 'flex', padding: '4px',
        }}>
          <X size={16} />
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}