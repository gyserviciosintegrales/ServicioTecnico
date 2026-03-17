// src/pages/IngresoCliente.jsx
// Página pública — no requiere login
// Link: /#/ingreso-cliente

import { useState } from 'react';
import { CheckCircle, ChevronRight, ChevronLeft, User, Monitor, Wrench, Loader } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const TIPOS_EQUIPO = [
  'Notebook', 'PC de escritorio', 'All-in-One', 'Tablet',
  'Celular', 'Impresora', 'Monitor', 'Otro',
];

const PASOS = [
  { id: 1, label: 'Tus datos',     icon: User    },
  { id: 2, label: 'Tu equipo',     icon: Monitor },
  { id: 3, label: 'El problema',   icon: Wrench  },
];

const INICIAL = {
  nombre: '', apellido: '', email: '', telefono: '', dni: '', direccion: '',
  tipo_equipo: '', marca: '', modelo: '', numero_serie: '',
  problema: '',
};

export default function IngresoCliente() {
  const [paso, setPaso]         = useState(1);
  const [form, setForm]         = useState({ ...INICIAL });
  const [errores, setErrores]   = useState({});
  const [loading, setLoading]   = useState(false);
  const [resultado, setResultado] = useState(null); // { orden_id, email }
  const [errorGlobal, setErrorGlobal] = useState('');

  const set = (campo, valor) => {
    setForm(f => ({ ...f, [campo]: valor }));
    setErrores(e => ({ ...e, [campo]: '' }));
  };

  // ── Validaciones por paso ──────────────────────────
  const validarPaso = (p) => {
    const e = {};
    if (p === 1) {
      if (!form.nombre.trim())   e.nombre   = 'Obligatorio';
      if (!form.apellido.trim()) e.apellido = 'Obligatorio';
      if (!form.email.trim())    e.email    = 'Obligatorio';
      else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = 'Email inválido';
      if (!form.telefono.trim()) e.telefono = 'Obligatorio';
    }
    if (p === 2) {
      if (!form.tipo_equipo) e.tipo_equipo = 'Seleccioná el tipo';
      if (!form.marca.trim()) e.marca      = 'Obligatorio';
    }
    if (p === 3) {
      if (!form.problema.trim()) e.problema = 'Describí el problema';
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const siguiente = () => {
    if (validarPaso(paso)) setPaso(p => p + 1);
  };

  const anterior = () => {
    setErrores({});
    setPaso(p => p - 1);
  };

  const enviar = async () => {
    if (!validarPaso(3)) return;
    setLoading(true);
    setErrorGlobal('');
    try {
      const { data } = await axios.post(`${API}/publico/ingreso-cliente/`, form);
      setResultado(data);
    } catch (err) {
      const errs = err.response?.data?.errores;
      if (errs) {
        setErrores(errs);
        // volver al paso que tiene el error
        const campos1 = ['nombre','apellido','email','telefono','dni','direccion'];
        const campos2 = ['tipo_equipo','marca','modelo','numero_serie'];
        if (Object.keys(errs).some(k => campos1.includes(k))) setPaso(1);
        else if (Object.keys(errs).some(k => campos2.includes(k))) setPaso(2);
        else setPaso(3);
      } else {
        setErrorGlobal(err.response?.data?.mensaje || 'Error al enviar. Intentá de nuevo.');
      }
    } finally { setLoading(false); }
  };

  // ── Pantalla de éxito ──────────────────────────────
  if (resultado) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, maxWidth: '480px', textAlign: 'center', padding: '48px 40px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={36} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#f0f6fc', margin: '0 0 10px' }}>
            ¡Registro exitoso!
          </h2>
          <p style={{ fontSize: '14px', color: '#8b9ab0', margin: '0 0 28px', lineHeight: '1.6' }}>
            Te enviamos un email a <strong style={{ color: '#f0f6fc' }}>{resultado.email}</strong> con tus credenciales de acceso y el número de orden.
          </p>

          <div style={{ background: '#0d1421', border: '1px solid #1e2d40', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
            <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              Tu número de orden
            </p>
            <p style={{ fontSize: '36px', fontWeight: '900', color: '#06b6d4', margin: 0, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
              #{resultado.numero_orden}
            </p>
            <p style={{ fontSize: '12px', color: '#4a5568', margin: '8px 0 0' }}>
              Guardá este número para hacer seguimiento
            </p>
          </div>

          <a href="/#/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#06b6d4', color: '#080c14', fontWeight: '700', padding: '13px 28px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px' }}>
            Ingresar al sistema <ChevronRight size={16} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, maxWidth: '560px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Wrench size={22} color="#06b6d4" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#f0f6fc', margin: '0 0 6px' }}>
            Ingresá tu equipo
          </h1>
          <p style={{ fontSize: '13px', color: '#8b9ab0', margin: 0 }}>
            Completá el formulario y te avisamos cuando esté listo
          </p>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          {PASOS.map((p, i) => {
            const activo    = paso === p.id;
            const completado = paso > p.id;
            const Icono     = p.icon;
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', flex: i < PASOS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: completado ? '#10b981' : activo ? '#06b6d4' : '#1e2d40',
                    border: `2px solid ${completado ? '#10b981' : activo ? '#06b6d4' : '#1e2d40'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}>
                    {completado
                      ? <CheckCircle size={18} color="#fff" />
                      : <Icono size={16} color={activo ? '#080c14' : '#64748b'} />
                    }
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: activo ? '#06b6d4' : completado ? '#10b981' : '#64748b', whiteSpace: 'nowrap' }}>
                    {p.label}
                  </span>
                </div>
                {i < PASOS.length - 1 && (
                  <div style={{ flex: 1, height: '2px', background: completado ? '#10b981' : '#1e2d40', margin: '0 8px', marginBottom: '22px', transition: 'background 0.3s' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Paso 1: Datos personales ── */}
        {paso === 1 && (
          <div style={styles.stepContent}>
            <h3 style={styles.stepTitle}>Tus datos personales</h3>
            <div style={styles.grid2}>
              <Campo label="Nombre *" error={errores.nombre}>
                <input style={inputStyle(errores.nombre)} placeholder="Juan" value={form.nombre}
                  onChange={e => set('nombre', e.target.value)} />
              </Campo>
              <Campo label="Apellido *" error={errores.apellido}>
                <input style={inputStyle(errores.apellido)} placeholder="García" value={form.apellido}
                  onChange={e => set('apellido', e.target.value)} />
              </Campo>
            </div>
            <Campo label="Email *" error={errores.email}>
              <input style={inputStyle(errores.email)} type="email" placeholder="juan@email.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </Campo>
            <div style={styles.grid2}>
              <Campo label="Teléfono *" error={errores.telefono}>
                <input style={inputStyle(errores.telefono)} placeholder="+54 9 387 000-0000"
                  value={form.telefono} onChange={e => set('telefono', e.target.value)} />
              </Campo>
              <Campo label="DNI" error={errores.dni}>
                <input style={inputStyle(errores.dni)} placeholder="12345678"
                  value={form.dni} onChange={e => set('dni', e.target.value)} />
              </Campo>
            </div>
            <Campo label="Dirección" error={errores.direccion}>
              <input style={inputStyle(errores.direccion)} placeholder="Av. San Martín 123, Salta"
                value={form.direccion} onChange={e => set('direccion', e.target.value)} />
            </Campo>
          </div>
        )}

        {/* ── Paso 2: Datos del equipo ── */}
        {paso === 2 && (
          <div style={styles.stepContent}>
            <h3 style={styles.stepTitle}>Datos del equipo</h3>
            <Campo label="Tipo de equipo *" error={errores.tipo_equipo}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {TIPOS_EQUIPO.map(t => (
                  <button key={t} type="button" onClick={() => set('tipo_equipo', t)} style={{
                    padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                    border: `1px solid ${form.tipo_equipo === t ? '#06b6d4' : '#1e2d40'}`,
                    background: form.tipo_equipo === t ? 'rgba(6,182,212,0.12)' : '#0d1421',
                    color: form.tipo_equipo === t ? '#06b6d4' : '#64748b',
                    cursor: 'pointer', transition: 'all 0.15s',
                    fontFamily: 'Space Grotesk, sans-serif',
                  }}>
                    {t}
                  </button>
                ))}
              </div>
              {errores.tipo_equipo && <p style={styles.errorMsg}>{errores.tipo_equipo}</p>}
            </Campo>
            <div style={styles.grid2}>
              <Campo label="Marca *" error={errores.marca}>
                <input style={inputStyle(errores.marca)} placeholder="Dell, HP, Samsung..."
                  value={form.marca} onChange={e => set('marca', e.target.value)} />
              </Campo>
              <Campo label="Modelo" error={errores.modelo}>
                <input style={inputStyle(errores.modelo)} placeholder="Inspiron 15, Galaxy S21..."
                  value={form.modelo} onChange={e => set('modelo', e.target.value)} />
              </Campo>
            </div>
            <Campo label="Número de serie" error={errores.numero_serie}>
              <input style={inputStyle(errores.numero_serie)} placeholder="Ej: SN1234567890 (opcional)"
                value={form.numero_serie} onChange={e => set('numero_serie', e.target.value)} />
              <p style={{ fontSize: '11px', color: '#4a5568', margin: '5px 0 0' }}>
                Lo podés encontrar en la etiqueta del equipo o en la BIOS
              </p>
            </Campo>
          </div>
        )}

        {/* ── Paso 3: Descripción del problema ── */}
        {paso === 3 && (
          <div style={styles.stepContent}>
            <h3 style={styles.stepTitle}>¿Qué le pasa al equipo?</h3>
            <Campo label="Describí el problema *" error={errores.problema}>
              <textarea style={{ ...inputStyle(errores.problema), resize: 'vertical', minHeight: '130px', lineHeight: '1.5' }}
                placeholder="Ej: La notebook no enciende. Cuando aprieto el botón de encendido hace un click pero la pantalla no muestra nada y el ventilador no gira."
                value={form.problema} onChange={e => set('problema', e.target.value)} />
            </Campo>

            {/* Resumen */}
            <div style={{ background: '#0d1421', border: '1px solid #1e2d40', borderRadius: '10px', padding: '16px', marginTop: '8px' }}>
              <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Resumen</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  ['Cliente', `${form.nombre} ${form.apellido}`],
                  ['Email',   form.email],
                  ['Equipo',  `${form.tipo_equipo} ${form.marca} ${form.modelo}`.trim()],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>{k}</span>
                    <span style={{ color: '#f0f6fc', fontWeight: '500' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {errorGlobal && (
              <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', marginTop: '12px' }}>
                <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{errorGlobal}</p>
              </div>
            )}
          </div>
        )}

        {/* Navegación */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', gap: '10px' }}>
          {paso > 1 ? (
            <button onClick={anterior} style={styles.btnSecondary}>
              <ChevronLeft size={16} /> Anterior
            </button>
          ) : <div />}

          {paso < 3 ? (
            <button onClick={siguiente} style={styles.btnPrimary}>
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={enviar} disabled={loading} style={{ ...styles.btnPrimary, minWidth: '160px' }}>
              {loading
                ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Enviando...</>
                : <><CheckCircle size={15} /> Confirmar ingreso</>
              }
            </button>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#4a5568', marginTop: '24px' }}>
          ¿Ya tenés cuenta?{' '}
          <a href="/#/login" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: '600' }}>
            Iniciá sesión
          </a>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input, textarea, select {
          outline: none;
          font-family: 'Space Grotesk', sans-serif;
        }
        input::placeholder, textarea::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}

// ── Componente Campo ────────────────────────────────
function Campo({ label, error, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      {label && <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>{label}</label>}
      {children}
      {error && <p style={styles.errorMsg}>{error}</p>}
    </div>
  );
}

// ── Estilos ─────────────────────────────────────────
function inputStyle(error) {
  return {
    width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
    background: '#0d1421', color: '#f0f6fc',
    border: `1px solid ${error ? '#ef4444' : '#1e2d40'}`,
    transition: 'border-color 0.15s',
  };
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #080c14 0%, #0d1421 50%, #080c14 100%)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '40px 16px 60px',
  },
  card: {
    background: '#111827', border: '1px solid #1e2d40',
    borderRadius: '18px', padding: '36px 32px', width: '100%',
    boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
  },
  stepContent: { animation: 'fadeIn 0.2s ease' },
  stepTitle: { fontSize: '15px', fontWeight: '700', color: '#f0f6fc', margin: '0 0 20px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  errorMsg: { fontSize: '11px', color: '#ef4444', margin: '4px 0 0' },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '11px 22px', borderRadius: '9px', border: 'none',
    background: '#06b6d4', color: '#080c14', fontWeight: '700',
    fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: 'Space Grotesk, sans-serif',
  },
  btnSecondary: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '11px 18px', borderRadius: '9px',
    border: '1px solid #1e2d40', background: 'transparent',
    color: '#94a3b8', fontWeight: '600', fontSize: '14px',
    cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
  },
};