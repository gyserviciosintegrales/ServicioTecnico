import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, User, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import logo from '../assets/logo_GY.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  const handle = (e) => {
    setError('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting.current) return;
    if (!form.username.trim() || !form.password.trim()) {
      setError('Por favor, completa todos los campos'); return;
    }
    submitting.current = true;
    setLoading(true); 
    setError('');
    try {
      const decoded = await login(form.username.trim(), form.password);
      const redirects = { admin: '/admin', tecnico: '/tecnico', cliente: '/cliente' };
      navigate(redirects[decoded.rol] ?? '/login', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Credenciales inválidas';
      setError(msg); toast.error(msg);
    } finally {
      setLoading(false); submitting.current = false;
    }
  };

  return (
    <div className="login-container">
      {/* Fondo con sutil patrón de malla */}
      <div className="bg-decoration" />
      
      <div className="login-card-wrapper">
        <div className="login-header">
          {/* LOGO MÁS GRANDE AQUÍ */}
          <img src={logo} alt="TallerTech" className="login-logo" />
          <h1>Bienvenido</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <div className="login-card">
          <form onSubmit={submit} noValidate>
            
            <div className="form-group">
              <label><User size={14} /> Usuario</label>
              <input 
                className={`modern-input ${error ? 'input-error' : ''}`}
                name="username" 
                placeholder="nombre.usuario"
                value={form.username} 
                onChange={handle} 
                autoComplete="username" 
                autoFocus 
              />
            </div>

            <div className="form-group">
              <div className="password-wrapper">
                <label><Lock size={14} /> Contraseña</label>
                <input 
                  className={`modern-input ${error ? 'input-error' : ''}`}
                  type={showPass ? 'text' : 'password'} 
                  name="password"
                  placeholder="••••••••" 
                  value={form.password} 
                  onChange={handle}
                  autoComplete="current-password"/>
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="label-row">
                <Link to="/forgot-password" title="Recuperar acceso" className="forgot-link">
                  ¿La olvidaste?
                </Link>
              </div>
            </div>

            {error && <div className="error-message">⚠ {error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  <span>Ingresar</span>
                  <LogIn size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="footer-text">
          ¿No tienes cuenta? <Link to="/register">Crea una ahora</Link>
        </p>
      </div>

      <style>{`
        :root {
          --primary: #06b6d4;
          --primary-hover: #0891b2;
          --bg-dark: #0f172a;
          --card-bg: #1e293b;
          --text-main: #f8fafc;
          --text-muted: #94a3b8;
          --border-color: #334155;
        }

        .login-container {
          min-height: 100vh;
          background-color: var(--bg-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: var(--text-main);
          font-family: 'Inter', -apple-system, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .bg-decoration {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
          background-size: 32px 32px;
          mask-image: radial-gradient(circle at center, black, transparent 80%);
          pointer-events: none;
        }

        .login-card-wrapper {
          width: 100%;
          max-width: 400px;
          z-index: 10;
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .login-logo {
          height: 200px;
          width: auto;
          object-fit: contain;
          margin-bottom: 16px;
          filter: drop-shadow(0 0 15px rgba(6, 182, 212, 0.5));
        }

        .login-header h1 {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin: 0;
        }

        .login-header p {
          color: var(--text-muted);
          font-size: 15px;
          margin-top: 8px;
        }

        .login-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
        }

        .form-group { margin-bottom: 20px; }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
        }

        .forgot-link {
          font-size: 12px;
          color: var(--primary);
          text-decoration: none;
          transition: filter 0.2s;
        }
        .forgot-link:hover { filter: brightness(1.2); text-decoration: underline; }

        .modern-input {
          width: 100%;
          background: #0f172a;
          border: 1.5px solid var(--border-color);
          border-radius: 10px;
          padding: 12px 14px;
          color: white;
          font-size: 15px;
          transition: all 0.2s ease;
        }

        .modern-input:focus {
          outline: none;
          border-color: var(--primary);
          background: #1e293b;
          box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.15);
        }

        .input-error { border-color: #ef4444 !important; }

        .password-wrapper { position: relative; }

        .toggle-pass {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          padding: 4px;
          border-radius: 6px;
        }
        .toggle-pass:hover { color: var(--text-main); background: rgba(255,255,255,0.05); }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .login-btn {
          width: 100%;
          background: var(--primary);
          color: #080c14;
          border: none;
          border-radius: 10px;
          padding: 14px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .login-btn:hover:not(:disabled) {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
        }

        .login-btn:active { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .footer-text {
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
          color: var(--text-muted);
        }

        .footer-text a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }
        .footer-text a:hover { text-decoration: underline; }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0,0,0,0.1);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}