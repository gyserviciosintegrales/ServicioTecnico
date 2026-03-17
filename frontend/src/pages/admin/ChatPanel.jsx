// src/pages/admin/ChatPanel.jsx
// Panel completo de chat para admin y técnicos
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, Search, Clock, CheckCheck, User, X } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const POLL_MS = 3000;
const ESTADO_COLORS = {
  abierta:  { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', label: 'Abierta' },
  en_curso: { bg: 'rgba(16,185,129,0.12)',  text: '#10b981', label: 'En curso' },
  cerrada:  { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', label: 'Cerrada' },
};

export default function ChatPanel() {
  const { user } = useAuth();
  const [convs, setConvs]           = useState([]);
  const [convActiva, setConvActiva] = useState(null);
  const [mensajes, setMensajes]     = useState([]);
  const [texto, setTexto]           = useState('');
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [busqueda, setBusqueda]     = useState('');
  const [filtro, setFiltro]         = useState('todas');

  const bottomRef = useRef(null);
  const pollRef   = useRef(null);
  const lastIdRef = useRef(0);
  const inputRef  = useRef(null);

  // ── Cargar lista ───────────────────────────────────────
  const fetchConvs = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/');
      setConvs(data.results ?? data);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  // Polling lista cada 10s
  useEffect(() => {
    const t = setInterval(fetchConvs, 10_000);
    return () => clearInterval(t);
  }, [fetchConvs]);

  // ── Abrir conversación ─────────────────────────────────
  const abrirConv = async (conv) => {
    clearInterval(pollRef.current);
    setConvActiva(conv);
    setMensajes([]);
    lastIdRef.current = 0;
    try {
      const { data } = await api.get(`/chat/${conv.id}/`);
      setMensajes(data.mensajes ?? []);
      if (data.mensajes?.length) {
        lastIdRef.current = Math.max(...data.mensajes.map(m => m.id));
      }
      await api.post(`/chat/${conv.id}/leer/`);
      // Actualizar no_leidos en la lista
      setConvs(prev => prev.map(c => c.id === conv.id ? { ...c, no_leidos: 0 } : c));
    } catch { /* silencioso */ }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Polling mensajes ───────────────────────────────────
  const pollMensajes = useCallback(async () => {
    if (!convActiva) return;
    try {
      const { data } = await api.get(`/chat/${convActiva.id}/mensajes/?desde=${lastIdRef.current}`);
      if (data.length > 0) {
        setMensajes(prev => {
          const ids  = new Set(prev.map(m => m.id));
          const news = data.filter(m => !ids.has(m.id));
          if (news.length) lastIdRef.current = Math.max(...news.map(m => m.id));
          return [...prev, ...news];
        });
        // Marcar leídos automáticamente si el panel está abierto
        api.post(`/chat/${convActiva.id}/leer/`).catch(() => {});
      }
    } catch { /* silencioso */ }
  }, [convActiva]);

  useEffect(() => {
    if (convActiva) {
      pollRef.current = setInterval(pollMensajes, POLL_MS);
    }
    return () => clearInterval(pollRef.current);
  }, [convActiva, pollMensajes]);

  // Scroll al fondo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // ── Enviar ─────────────────────────────────────────────
  const enviar = async (e) => {
    e?.preventDefault();
    const t = texto.trim();
    if (!t || sending || !convActiva || convActiva.estado === 'cerrada') return;
    setSending(true);
    const optimista = {
      id: Date.now(), texto: t,
      autor: user.id,
      autor_nombre: `${user.first_name} ${user.last_name}`,
      autor_rol: user.rol, leido: false,
      fecha_display: 'Ahora', es_propio: true,
    };
    setMensajes(prev => [...prev, optimista]);
    setTexto('');
    try {
      const { data } = await api.post(`/chat/${convActiva.id}/mensaje/`, { texto: t });
      setMensajes(prev => prev.map(m => m.id === optimista.id ? data : m));
      lastIdRef.current = data.id;
      // Si pasó de abierta a en_curso, actualizar estado en la lista
      fetchConvs();
    } catch {
      setMensajes(prev => prev.filter(m => m.id !== optimista.id));
      setTexto(t);
    } finally { setSending(false); }
  };

  // ── Cerrar conversación ────────────────────────────────
  const cerrarConv = async () => {
    if (!convActiva) return;
    try {
      await api.post(`/chat/${convActiva.id}/cerrar/`);
      setConvActiva(prev => ({ ...prev, estado: 'cerrada' }));
      fetchConvs();
    } catch { /* silencioso */ }
  };

  // ── Filtrar lista ──────────────────────────────────────
  const convsFiltradas = convs.filter(c => {
    const matchBusq = !busqueda ||
      c.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.asunto.toLowerCase().includes(busqueda.toLowerCase());
    const matchFiltro = filtro === 'todas' || c.estado === filtro;
    return matchBusq && matchFiltro;
  });

  const cerrada = convActiva?.estado === 'cerrada';

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - var(--topbar-h) - 56px)',
      minHeight: '400px', gap: '0',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '14px', overflow: 'hidden',
    }}>

      {/* ════ PANEL IZQUIERDO — Lista ════ */}
      <div style={{
        width: '300px', flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-secondary)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <MessageCircle size={16} color="var(--accent-cyan)" />
            <span style={{ fontWeight: '700', fontSize: '15px' }}>Conversaciones</span>
            {convs.filter(c => c.no_leidos > 0).length > 0 && (
              <span style={{
                background: '#ef4444', color: '#fff', fontSize: '10px',
                fontWeight: '700', padding: '1px 6px', borderRadius: '999px',
              }}>
                {convs.reduce((s, c) => s + (c.no_leidos || 0), 0)}
              </span>
            )}
          </div>

          {/* Buscador */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              placeholder="Buscar..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '13px', padding: '8px 10px 8px 32px' }}
            />
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['todas', 'abierta', 'en_curso', 'cerrada'].map(f => (
              <button key={f} onClick={() => setFiltro(f)} style={{
                flex: 1, padding: '4px', borderRadius: '6px', border: 'none',
                background: filtro === f ? 'rgba(6,182,212,0.15)' : 'transparent',
                color:      filtro === f ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontSize:   '10px', fontWeight: '600', cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}>
                {f === 'todas' ? 'Todas' : f === 'en_curso' ? 'En curso' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de convs */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          )}
          {!loading && convsFiltradas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {busqueda ? 'Sin resultados' : 'Sin conversaciones'}
              </p>
            </div>
          )}
          {convsFiltradas.map(conv => {
            const cfg = ESTADO_COLORS[conv.estado] ?? ESTADO_COLORS.cerrada;
            const isActive = convActiva?.id === conv.id;
            return (
              <div key={conv.id} onClick={() => abrirConv(conv)} style={{
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                background: isActive ? 'rgba(6,182,212,0.06)' : 'transparent',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '13px', fontWeight: conv.no_leidos > 0 ? '700' : '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {conv.cliente_nombre}
                  </span>
                  <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '999px', background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.text}25`, fontWeight: '700', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {cfg.label}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.asunto}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {conv.ultimo_mensaje && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {conv.ultimo_mensaje.texto}
                    </span>
                  )}
                  {conv.no_leidos > 0 && (
                    <span style={{ background: 'var(--accent-cyan)', color: '#080c14', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '999px', flexShrink: 0, marginLeft: '6px' }}>
                      {conv.no_leidos}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════ PANEL DERECHO — Chat ════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Sin conv seleccionada */}
        {!convActiva && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <MessageCircle size={26} color="var(--text-muted)" />
            </div>
            <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Seleccioná una conversación</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Elegí una conversación de la izquierda para ver los mensajes</p>
          </div>
        )}

        {/* Conv activa */}
        {convActiva && (
          <>
            {/* Header del chat */}
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0, gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={16} color="#f59e0b" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: '700', fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {convActiva.cliente_nombre}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {convActiva.asunto}
                    {convActiva.orden_numero && ` · Orden #${convActiva.orden_numero}`}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px', padding: '4px 10px', borderRadius: '999px',
                  background: ESTADO_COLORS[convActiva.estado]?.bg,
                  color:      ESTADO_COLORS[convActiva.estado]?.text,
                  fontWeight: '600',
                }}>
                  {ESTADO_COLORS[convActiva.estado]?.label}
                </span>
                {convActiva.estado !== 'cerrada' && (
                  <button onClick={cerrarConv} title="Cerrar conversación" style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '12px', display: 'flex',
                    alignItems: 'center', gap: '5px', fontFamily: 'Space Grotesk, sans-serif',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <X size={12} /> Cerrar
                  </button>
                )}
              </div>
            </div>

            {/* Mensajes */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mensajes.length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sin mensajes aún</p>
                </div>
              )}
              {mensajes.map(msg => (
                <BurbujaAdmin key={msg.id} msg={msg} userId={user.id} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Aviso cerrada */}
            {cerrada && (
              <div style={{
                padding: '12px 20px', background: 'rgba(74,85,104,0.08)',
                borderTop: '1px solid var(--border)',
                fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center',
              }}>
                🔒 Conversación cerrada — solo lectura
              </div>
            )}

            {/* Input */}
            {!cerrada && (
              <form onSubmit={enviar} style={{
                padding: '12px 16px', borderTop: '1px solid var(--border)',
                display: 'flex', gap: '10px', alignItems: 'flex-end', flexShrink: 0,
              }}>
                <textarea
                  ref={inputRef}
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                  placeholder="Escribí tu respuesta... (Enter para enviar, Shift+Enter nueva línea)"
                  rows={2}
                  style={{
                    flex: 1, background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)', borderRadius: '10px',
                    padding: '10px 14px', color: 'var(--text-primary)',
                    fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px',
                    outline: 'none', resize: 'none', lineHeight: '1.4',
                    maxHeight: '100px', overflowY: 'auto',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button type="submit" disabled={!texto.trim() || sending} className="btn-primary" style={{
                  padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '7px',
                  opacity: (!texto.trim() || sending) ? 0.55 : 1,
                  cursor: (!texto.trim() || sending) ? 'not-allowed' : 'pointer',
                }}>
                  {sending
                    ? <div style={{ width: '15px', height: '15px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#080c14', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    : <Send size={15} />
                  }
                  Enviar
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── Burbuja admin ──────────────────────────────────────
function BurbujaAdmin({ msg, userId }) {
  const esPropio = msg.autor === userId || msg.es_propio;
  return (
    <div style={{ display: 'flex', flexDirection: esPropio ? 'row-reverse' : 'row', gap: '8px', alignItems: 'flex-end' }}>
      {!esPropio && (
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
          background: msg.autor_rol === 'cliente' ? 'rgba(245,158,11,0.15)' : 'rgba(6,182,212,0.15)',
          border: `1px solid ${msg.autor_rol === 'cliente' ? 'rgba(245,158,11,0.3)' : 'rgba(6,182,212,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: '700',
          color: msg.autor_rol === 'cliente' ? '#f59e0b' : '#06b6d4',
        }}>
          {msg.autor_nombre?.[0]?.toUpperCase()}
        </div>
      )}
      <div style={{ maxWidth: '70%' }}>
        {!esPropio && (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', paddingLeft: '2px' }}>
            {msg.autor_nombre}
            {msg.autor_rol !== 'cliente' && (
              <span style={{ marginLeft: '5px', fontSize: '10px', padding: '1px 6px', borderRadius: '999px', background: 'rgba(6,182,212,0.12)', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                Soporte
              </span>
            )}
          </p>
        )}
        <div style={{
          padding: '10px 14px',
          borderRadius: esPropio ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: esPropio ? 'linear-gradient(135deg, var(--accent-cyan), #0891b2)' : 'var(--bg-secondary)',
          color: esPropio ? '#fff' : 'var(--text-primary)',
          fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word',
          border: esPropio ? 'none' : '1px solid var(--border)',
        }}>
          {msg.texto}
        </div>
        <p style={{
          fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px',
          textAlign: esPropio ? 'right' : 'left', paddingInline: '2px',
          fontFamily: 'JetBrains Mono, monospace',
          display: 'flex', alignItems: 'center', gap: '4px',
          justifyContent: esPropio ? 'flex-end' : 'flex-start',
        }}>
          <Clock size={9} /> {msg.fecha_display}
          {esPropio && (msg.leido ? <CheckCheck size={10} color="var(--accent-cyan)" /> : <CheckCheck size={10} />)}
        </p>
      </div>
    </div>
  );
}