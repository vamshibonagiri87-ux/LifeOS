import { create } from 'zustand';
import { api } from '../services/api.js';
import { reconnectSocketWithAuth } from '../services/socket.js';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('lifeos_user') || 'null'),
  token: localStorage.getItem('lifeos_token') || null,
  isAuthenticated: !!localStorage.getItem('lifeos_token'),
  loading: false,
  error: null,
  theme: localStorage.getItem('lifeos_theme') || 'dark',

  initTheme: () => {
    const savedTheme = localStorage.getItem('lifeos_theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  },

  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('lifeos_theme', next);
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    set({ theme: next });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data;

      localStorage.setItem('lifeos_token', token);
      localStorage.setItem('lifeos_user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      reconnectSocketWithAuth();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { user, token } = response.data.data;

      localStorage.setItem('lifeos_token', token);
      localStorage.setItem('lifeos_user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      reconnectSocketWithAuth();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please try again.';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('lifeos_token');
    localStorage.removeItem('lifeos_user');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  checkAuth: async () => {
    const token = localStorage.getItem('lifeos_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }
    try {
      const response = await api.get('/auth/me');
      const user = response.data.data.user;
      localStorage.setItem('lifeos_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (err) {
      localStorage.removeItem('lifeos_token');
      localStorage.removeItem('lifeos_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
