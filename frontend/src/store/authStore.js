import { create } from 'zustand';
import { authService } from '../services/api';
import { isAuthenticated as checkAuth } from '../utils/auth';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: checkAuth(),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authService.login({ email, password });
      // api returns full axios response; backend wraps payload under data.data
      const payload = response.data?.data || response.data;
      const { user, tokens } = payload;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);

      set({ 
        user, 
        accessToken: tokens.accessToken,
        isAuthenticated: true,
        isLoading: false 
      });
      return payload;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await authService.register(userData);
      const payload = response.data?.data || response.data;
      const { user, tokens } = payload;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);

      set({ 
        user, 
        accessToken: tokens.accessToken,
        isAuthenticated: true,
        isLoading: false 
      });
      return payload;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    set({ 
      user: null, 
      accessToken: null,
      isAuthenticated: false 
    });
  },

  updateUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData });
  },
  initAuth: async () => {
    const access = localStorage.getItem('accessToken');
    const refresh = localStorage.getItem('refreshToken');
    // If access token missing or expired, try refresh
    const { isTokenExpired } = await import('../utils/auth');
    if (!access && refresh) {
      try {
        const res = await authService.refreshToken(refresh);
        const payload = res.data?.data || res.data;
        const newAccess = payload?.accessToken;
        if (newAccess) {
          localStorage.setItem('accessToken', newAccess);
          set({ accessToken: newAccess, isAuthenticated: true });
        }
      } catch (e) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ user: null, accessToken: null, isAuthenticated: false });
      }
    } else if (access && isTokenExpired(access) && refresh) {
      try {
        const res = await authService.refreshToken(refresh);
        const payload = res.data?.data || res.data;
        const newAccess = payload?.accessToken;
        if (newAccess) {
          localStorage.setItem('accessToken', newAccess);
          set({ accessToken: newAccess, isAuthenticated: true });
        }
      } catch (e) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ user: null, accessToken: null, isAuthenticated: false });
      }
    }
  },
}));

export default useAuthStore;
