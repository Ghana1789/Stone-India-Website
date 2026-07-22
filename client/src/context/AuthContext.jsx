import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('si_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('si_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('si_token');
      if (savedToken) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
          setToken(savedToken);
        } catch (error) {
          // Only drop the session if explicitly UNAUTHORIZED (401).
          // If the server is just down (no response) or having a 500 error, keep the user logged in.
          if (error.response?.status === 401) {
            console.error('initAuth failed (Unauthorized), dropping token');
            localStorage.removeItem('si_token');
            localStorage.removeItem('si_user');
            setToken(null);
            setUser(null);
          } else {
            console.warn('initAuth encountered a temporary error, preserving session:', error.message);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password, captchaAnswer, captchaToken) => {
    const { data } = await api.post('/auth/login', { email, password, captchaAnswer, captchaToken });
    if (data.mfaRequired) {
      return { mfaRequired: true, mfaToken: data.mfaToken };
    }
    if (data.token) {
      localStorage.setItem('si_token', data.token);
    }
    localStorage.setItem('si_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const verifyMfa = async (mfaToken, code) => {
    const { data } = await api.post('/auth/mfa/verify', { mfaToken, code });
    if (data.token) {
      localStorage.setItem('si_token', data.token);
    }
    localStorage.setItem('si_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Backend logout failed:', error.message);
    }
    localStorage.removeItem('si_token');
    localStorage.removeItem('si_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('si_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, verifyMfa, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
