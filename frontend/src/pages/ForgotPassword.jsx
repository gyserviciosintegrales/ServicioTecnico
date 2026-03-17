import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import logo from '../assets/logo_taller.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(false);

  const submit = async (e) => {
    e.preventDefault();
    if (ref.current) return;
    ref.current = true;
    setLoading(true);
    try {
      await api.post('/auth/reset/solicitar/', { email: email.trim() });
      setSent(true);
    } catch { setError('Error al procesar la solicitud.'); }
    finally { setLoading(false); ref.current = false; }
  };

  return (
    <div className="login-container">
      <div className="bg-decoration" />
      <div className="login-card-wrapper" style={{ maxWidth: '400px' }}>
        <div className="login-header">
          <img src={logo} alt="TallerTech" className="login-logo" />
          <h1>Recuperar Clave</h1>
          <p>Te ayudaremos a volver a tu cuenta</p>
        </div>
        <div className="login-card">
          {!sent ? (
            <form onSubmit={submit}>
              <div className="form-group">
                <label><Mail size={14} /> Correo Electrónico</label>
                <input className="modern-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" autoFocus />
              </div>
              {error && <div className="error-message">⚠ {error}</div>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <div className="spinner" /> : <><span>Enviar Enlace</span><Mail size={18} /></>}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={50} color="#10b981" style={{ marginBottom: '15px' }} />
              <h3>¡Email enviado!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Revisa tu correo para continuar.</p>
            </div>
          )}
        </div>
        <p className="footer-text"><Link to="/login" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><ArrowLeft size={16}/> Volver al Login</Link></p>
      </div>
      <style>{COMMON_CSS}</style>
    </div>
  );
}
/* (Usa el mismo COMMON_CSS del archivo de arriba) */
const COMMON_CSS = `
  :root { --primary: #06b6d4; --bg-dark: #0f172a; --card-bg: #1e293b; --text-main: #f8fafc; --text-muted: #94a3b8; --border-color: #334155; }
  .login-container { min-height: 100vh; background-color: var(--bg-dark); display: flex; align-items: center; justify-content: center; padding: 24px; color: var(--text-main); font-family: 'Inter', sans-serif; position: relative; overflow: hidden; }
  .bg-decoration { position: absolute; inset: 0; background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 32px 32px; mask-image: radial-gradient(circle at center, black, transparent 80%); pointer-events: none; }
  .login-card-wrapper { width: 100%; z-index: 10; animation: fadeInUp 0.7s ease; }
  .login-header { text-align: center; margin-bottom: 32px; display: flex; flex-direction: column; align-items: center; }
  .login-logo { height: 120px; width: auto; object-fit: contain; margin-bottom: 16px; filter: drop-shadow(0 0 15px rgba(6, 182, 212, 0.5)); }
  .login-header h1 { font-size: 32px; font-weight: 800; margin: 0; }
  .login-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 20px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); }
  .register-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
  .full-width { grid-column: span 2; }
  .form-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
  label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); }
  .modern-input { width: 100%; background: #0f172a; border: 1.5px solid var(--border-color); border-radius: 10px; padding: 12px 14px; color: white; transition: all 0.2s ease; }
  .modern-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.15); }
  .password-wrapper { position: relative; }
  .toggle-pass { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; }
  .login-btn { width: 100%; background: var(--primary); color: #080c14; border: none; border-radius: 10px; padding: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
  .footer-text { text-align: center; margin-top: 24px; font-size: 14px; color: var(--text-muted); }
  .footer-text a { color: var(--primary); text-decoration: none; font-weight: 600; }
  .error-message { background: rgba(239, 68, 68, 0.1); color: #f87171; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.2); }
  .spinner { width: 18px; height: 18px; border: 2px solid rgba(0,0,0,0.1); border-top-color: #000; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 500px) { .register-grid { grid-template-columns: 1fr; } .full-width { grid-column: span 1; } }
`;