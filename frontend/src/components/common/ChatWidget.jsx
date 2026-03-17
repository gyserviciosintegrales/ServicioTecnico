// src/components/common/ChatWidget.jsx
// Widget flotante de chat para clientes — se incluye en Layout
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, ChevronDown, Plus, Clock } from 'lucide-react';
import api from '../../api/axios';

const POLL_MS = 3000;

export default function ChatWidget({ user }) {
  const [open, setOpen]             = useState(false);
  const [vista, setVista]           = useState('lista');   // 'lista' | 'chat'
  const [convs, setConvs]           = useState([]);
  const [convActiva, setConvActiva] = useState(null);
  const [mensajes, setMensajes]     = useState([]);
  const [texto, setTexto]           = useState('');
  const [noLeidos, setNoLeidos]     = useState(0);
  const [loading, setLoading]       = useState(false);
  const [sending, setSending]       = useState(false);
  const [showNuevo, setShowNuevo]   = useState(false);
  const [nuevoAsunto, setNuevoAsunto] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [creando, setCreando]       = useState(false);

  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);
  const lastIdRef  = useRef(0);
  const inputRef   = useRef(null);

  // ── Conteo no leídos (siempre activo) ────────────────
  const fetchConteo = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/conteo/');
      setNoLeidos(data.no_leidos);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    fetchConteo();
    const t = setInterval(fetchConteo, 10_000);
    return () => clearInterval(t);
  }, [fetchConteo]);

  // ── Cargar lista de conversaciones ───────────────────
  const fetchConvs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/chat/');
      setConvs(data.results ?? data);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (open && vista === 'lista') fetchConvs();
  }, [open, vista, fetchConvs]);

  // ── Polling de mensajes ───────────────────────────────
  const pollMensajes = useCallback(async () => {
    if (!convActiva) return;
    try {
      const { data } = await api.get(`/chat/${convActiva.id}/mensajes/?desde=${lastIdRef.current}`);
      if (data.length > 0) {
        setMensajes(prev => {
          const ids = new Set(prev.map(m => m.id));
          const nuevos = data.filter(m => !ids.has(m.id));
          if (nuevos.length) lastIdRef.current = Math.max(...nuevos.map(m => m.id));
          return [...prev, ...nuevos];
        });
        setNoLeidos(0);
      }
    } catch { /* silencioso */ }
  }, [convActiva]);

  useEffect(() => {
    if (convActiva && vista === 'chat') {
      pollRef.current = setInterval(pollMensajes, POLL_MS);
    }
    return () => clearInterval(pollRef.current);
  }, [convActiva, vista, pollMensajes]);

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Focus en el input al abrir chat
  useEffect(() => {
    if (vista === 'chat') setTimeout(() => inputRef.current?.focus(), 100);
  }, [vista]);

  // ── Abrir conversación ────────────────────────────────
  const abrirConv = async (conv) => {
    setConvActiva(conv);
    setMensajes([]);
    lastIdRef.current = 0;
    setVista('chat');
    try {
      const { data } = await api.get(`/chat/${conv.id}/`);
      setMensajes(data.mensajes ?? []);
      if (data.mensajes?.length) {
        lastIdRef.current = Math.max(...data.mensajes.map(m => m.id));
      }
      // Marcar como leídos
      await api.post(`/chat/${conv.id}/leer/`);
      setNoLeidos(0);
    } catch { /* silencioso */ }
  };

  // ── Enviar mensaje ────────────────────────────────────
  const enviar = async (e) => {
    e?.preventDefault();
    const t = texto.trim();
    if (!t || sending || !convActiva) return;
    setSending(true);
    const optimista = {
      id: Date.now(), texto: t, autor: user.id,
      autor_nombre: `${user.first_name} ${user.last_name}`,
      autor_rol: user.rol, leido: false, fecha_display: 'Ahora', es_propio: true,
    };
    setMensajes(prev => [...prev, optimista]);
    setTexto('');
    try {
      const { data } = await api.post(`/chat/${convActiva.id}/mensaje/`, { texto: t });
      setMensajes(prev => prev.map(m => m.id === optimista.id ? data : m));
      lastIdRef.current = data.id;
    } catch {
      setMensajes(prev => prev.filter(m => m.id !== optimista.id));
      setTexto(t);
    } finally { setSending(false); }
  };

  // ── Crear nueva conversación ──────────────────────────
  const crearConv = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;
    setCreando(true);
    try {
      const { data } = await api.post('/chat/', {
        asunto:  nuevoAsunto.trim() || 'Consulta general',
        mensaje: nuevoMensaje.trim(),
      });
      setConvs(prev => [data, ...prev]);
      setNuevoAsunto(''); setNuevoMensaje('');
      setShowNuevo(false);
      abrirConv(data);
    } catch { /* silencioso */ }
    finally { setCreando(false); }
  };

  // ── ESTADO: Cerrada → solo lectura ───────────────────
  const cerrada = convActiva?.estado === 'cerrada';

  // ── Colores por estado ───────────────────────────────
  const estadoColor = { abierta: '#f59e0b', en_curso: '#10b981', cerrada: '#4a5568' };

  return (
    <>
      {/* ── Botón flotante ── */}
      <button
        onClick={() => { setOpen(v => !v); if (!open) { setVista('lista'); setShowNuevo(false); } }}
        style={{
          position:     'fixed',
          bottom:       '24px',
          right:        '24px',
          width:        '52px',
          height:       '52px',
          borderRadius: '50%',
          background:   'var(--accent-cyan)',
          border:       'none',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          boxShadow:    '0 4px 20px rgba(6,182,212,0.4)',
          zIndex:       300,
          transition:   'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(6,182,212,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 4px 20px rgba(6,182,212,0.4)'; }}
        title="Soporte en línea"
      >
        {open
          ? <ChevronDown size={22} color="#080c14" />
          : <MessageCircle size={22} color="#080c14" />
        }
        {!open && noLeidos > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#ef4444', color: '#fff',
            fontSize: '10px', fontWeight: '700',
            padding: '1px 5px', borderRadius: '999px',
            border: '2px solid var(--bg-primary)',
            minWidth: '16px', textAlign: 'center',
          }}>
            {noLeidos}
          </span>
        )}
      </button>

      {/* ── Panel del chat ── */}
      {open && (
        <div style={{
          position:     'fixed',
          bottom:       '88px',
          right:        '24px',
          width:        'min(360px, calc(100vw - 32px))',
          height:       'min(520px, calc(100vh - 120px))',
          background:   'var(--bg-card)',
          border:       '1px solid var(--border-light)',
          borderRadius: '16px',
          display:      'flex',
          flexDirection:'column',
          zIndex:       300,
          boxShadow:    '0 20px 60px rgba(0,0,0,0.45)',
          animation:    'popUp 0.25s ease',
          overflow:     'hidden',
        }}>

          {/* ── Header ── */}
          <div style={{
            padding:        '14px 16px',
            background:     'linear-gradient(135deg, var(--accent-cyan), #0891b2)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            flexShrink:     0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              {vista === 'chat' && (
                <button onClick={() => { setVista('lista'); fetchConvs(); }} style={{
                  background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '6px',
                  padding: '4px', cursor: 'pointer', color: '#fff', display: 'flex',
                }}>
                  <ChevronDown size={14} style={{ transform: 'rotate(90deg)' }} />
                </button>
              )}
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageCircle size={15} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#fff', margin: 0 }}>
                  {vista === 'chat' ? (convActiva?.asunto ?? 'Chat') : 'Soporte en línea'}
                </p>
                {vista === 'lista' && (
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                    Respondemos en minutos
                  </p>
                )}
                {vista === 'chat' && convActiva && (
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                    {convActiva.estado === 'abierta' ? '⏳ Esperando agente...' : convActiva.estado === 'en_curso' ? '✅ En atención' : '🔒 Cerrada'}
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '8px',
              padding: '6px', cursor: 'pointer', color: '#fff', display: 'flex',
            }}>
              <X size={15} />
            </button>
          </div>

          {/* ── Vista: Lista de conversaciones ── */}
          {vista === 'lista' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Botón nueva conversación */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <button
                  onClick={() => setShowNuevo(v => !v)}
                  style={{
                    width: '100%', padding: '9px', borderRadius: '8px',
                    background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)',
                    color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '13px',
                    fontWeight: '600', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '6px', fontFamily: 'Space Grotesk, sans-serif',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(6,182,212,0.1)'}
                >
                  <Plus size={14} /> Nueva consulta
                </button>

                {/* Form nueva conversación */}
                {showNuevo && (
                  <form onSubmit={crearConv} style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      className="input-field"
                      placeholder="Asunto (ej: problema con mi equipo)"
                      value={nuevoAsunto}
                      onChange={e => setNuevoAsunto(e.target.value)}
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                    />
                    <textarea
                      className="input-field"
                      placeholder="Describí tu consulta..."
                      value={nuevoMensaje}
                      onChange={e => setNuevoMensaje(e.target.value)}
                      rows={3}
                      required
                      style={{ fontSize: '13px', padding: '8px 12px', resize: 'none', lineHeight: '1.4' }}
                    />
                    <button type="submit" disabled={creando} style={{
                      padding: '8px', borderRadius: '8px',
                      background: creando ? 'var(--bg-hover)' : 'var(--accent-cyan)',
                      color: creando ? 'var(--text-muted)' : '#080c14',
                      border: 'none', cursor: creando ? 'not-allowed' : 'pointer',
                      fontWeight: '600', fontSize: '13px', fontFamily: 'Space Grotesk, sans-serif',
                    }}>
                      {creando ? 'Enviando...' : 'Iniciar chat'}
                    </button>
                  </form>
                )}
              </div>

              {/* Lista */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading && convs.length === 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  </div>
                )}
                {!loading && convs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                    <p style={{ fontSize: '28px', marginBottom: '8px' }}>💬</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Sin conversaciones</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Iniciá una nueva consulta</p>
                  </div>
                )}
                {convs.map(conv => (
                  <div key={conv.id} onClick={() => abrirConv(conv)} style={{
                    padding: '12px 14px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s',
                    background: 'transparent',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {conv.asunto}
                      </span>
                      <span style={{
                        fontSize: '10px', padding: '2px 7px', borderRadius: '999px',
                        background: `${estadoColor[conv.estado]}18`,
                        color: estadoColor[conv.estado],
                        border: `1px solid ${estadoColor[conv.estado]}30`,
                        fontWeight: '600', whiteSpace: 'nowrap',
                      }}>
                        {conv.estado}
                      </span>
                    </div>
                    {conv.ultimo_mensaje && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.ultimo_mensaje.texto}
                      </p>
                    )}
                    {conv.no_leidos > 0 && (
                      <span style={{
                        display: 'inline-block', marginTop: '4px',
                        background: '#ef4444', color: '#fff',
                        fontSize: '10px', fontWeight: '700', padding: '1px 6px',
                        borderRadius: '999px',
                      }}>
                        {conv.no_leidos} nuevos
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Vista: Chat activo ── */}
          {vista === 'chat' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Mensajes */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mensajes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin mensajes aún. ¡Escribí tu consulta!</p>
                  </div>
                )}
                {mensajes.map(msg => (
                  <BurbujaMensaje key={msg.id} msg={msg} esPropio={msg.es_propio} />
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Aviso cerrada */}
              {cerrada && (
                <div style={{
                  padding: '10px 14px', background: 'rgba(74,85,104,0.12)',
                  borderTop: '1px solid var(--border)',
                  fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center',
                }}>
                  🔒 Esta conversación está cerrada
                </div>
              )}

              {/* Input */}
              {!cerrada && (
                <form onSubmit={enviar} style={{
                  padding: '10px 12px', borderTop: '1px solid var(--border)',
                  display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0,
                }}>
                  <textarea
                    ref={inputRef}
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                    placeholder="Escribí tu mensaje..."
                    rows={1}
                    style={{
                      flex: 1, background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)', borderRadius: '10px',
                      padding: '9px 12px', color: 'var(--text-primary)',
                      fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px',
                      outline: 'none', resize: 'none', lineHeight: '1.4',
                      maxHeight: '80px', overflowY: 'auto',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button type="submit" disabled={!texto.trim() || sending} style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: texto.trim() ? 'var(--accent-cyan)' : 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    cursor: texto.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.15s',
                  }}>
                    {sending
                      ? <div style={{ width: '14px', height: '14px', border: '2px solid var(--text-muted)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      : <Send size={14} color={texto.trim() ? '#080c14' : 'var(--text-muted)'} />
                    }
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes popUp  { from{opacity:0;transform:scale(0.92) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
    </>
  );
}

// ── Burbuja de mensaje ─────────────────────────────────
function BurbujaMensaje({ msg, esPropio }) {
  const isClient = msg.autor_rol === 'cliente';
  const bgColor  = esPropio
    ? 'linear-gradient(135deg, var(--accent-cyan), #0891b2)'
    : 'var(--bg-secondary)';

  return (
    <div style={{
      display:       'flex',
      flexDirection: esPropio ? 'row-reverse' : 'row',
      gap:           '7px',
      alignItems:    'flex-end',
    }}>
      {/* Avatar pequeño */}
      {!esPropio && (
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: isClient ? 'rgba(245,158,11,0.2)' : 'rgba(6,182,212,0.2)',
          border: `1px solid ${isClient ? 'rgba(245,158,11,0.3)' : 'rgba(6,182,212,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: '700', flexShrink: 0,
          color: isClient ? '#f59e0b' : '#06b6d4',
        }}>
          {msg.autor_nombre?.[0]?.toUpperCase()}
        </div>
      )}
      <div style={{ maxWidth: '80%' }}>
        {!esPropio && (
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', paddingLeft: '2px' }}>
            {msg.autor_nombre}
          </p>
        )}
        <div style={{
          padding:      '8px 12px',
          borderRadius: esPropio ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background:   bgColor,
          color:        esPropio ? '#fff' : 'var(--text-primary)',
          fontSize:     '13px',
          lineHeight:   '1.45',
          wordBreak:    'break-word',
          boxShadow:    '0 1px 4px rgba(0,0,0,0.15)',
        }}>
          {msg.texto}
        </div>
        <p style={{
          fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px',
          textAlign: esPropio ? 'right' : 'left', paddingInline: '2px',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {msg.fecha_display} {esPropio && (msg.leido ? '✓✓' : '✓')}
        </p>
      </div>
    </div>
  );
}