import { create } from 'zustand';
import { IAuth } from '@/domain/models';

interface AuthState {
  auth: Partial<IAuth> | null;
  setAuth: (auth: Partial<IAuth>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  auth: null,
  setAuth: (auth) => set({ auth }),
  clearAuth: () => set({ auth: null }),
}));
