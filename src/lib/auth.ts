import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from './api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales';
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      
      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const response = await api.post('/auth/login', { email, password });
          
          set({ 
            token: response.data.token, 
            user: response.data.user,
            isAuthenticated: true,
            loading: false
          });
        } catch (err: any) {
          set({ 
            error: err.response?.data?.message || 'Login failed', 
            loading: false,
            isAuthenticated: false
          });
        }
      },
      
      register: async (name, email, password, role = 'sales') => {
        try {
          set({ loading: true, error: null });
          const response = await api.post('/auth/register', { name, email, password, role });
          
          set({ 
            token: response.data.token, 
            user: response.data.user,
            isAuthenticated: true,
            loading: false
          });
        } catch (err: any) {
          set({ 
            error: err.response?.data?.message || 'Registration failed', 
            loading: false,
            isAuthenticated: false
          });
        }
      },
      
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
      
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

export const useAuthCheck = () => {
  const { isAuthenticated, user } = useAuthStore();
  
  const isAdmin = user?.role === 'admin';
  
  return { isAuthenticated, isAdmin, user };
};