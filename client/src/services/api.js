import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('si_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect on /auth/me calls as AuthContext handles that failure uniquely
      if (error.config?.url && !error.config.url.endsWith('/auth/me')) {
        console.error('Session expired or invalid token:', error.config?.url);
        localStorage.removeItem('si_token');
        localStorage.removeItem('si_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
