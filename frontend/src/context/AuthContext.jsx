import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }

    try {
      const { exp } = jwtDecode(token);
      if (Date.now() / 1000 >= exp) {
        localStorage.clear();
        setLoading(false);
        return;
      }
      fetchMe();
    } catch {
      localStorage.clear();
      setLoading(false);
    }
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/usuarios/me/');
      setUser(data);
    } catch {
      localStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    // Llamada al backend
    const { data } = await api.post('/auth/login/', { username, password });
    localStorage.setItem('access_token',  data.access);
    localStorage.setItem('refresh_token', data.refresh);

    // Decodificar token para obtener el rol sin esperar fetchMe
    const decoded = jwtDecode(data.access);

    // Cargar el perfil completo
    await fetchMe();

    // Retornar el decoded para que Login.jsx pueda redirigir por rol
    return decoded;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);