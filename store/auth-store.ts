import { create } from 'zustand';
import { SessionUser } from '@/lib/types';
import { getCurrentUser } from '@/lib/auth';

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  initialized: boolean;
  fetchUser: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  
  fetchUser: async () => {
    set({ loading: true });
    try {
      const user = await getCurrentUser();
      set({ user, initialized: true });
    } catch (e) {
      console.error("[auth store] fetchUser error:", e);
      set({ user: null, initialized: true });
    } finally {
      set({ loading: false });
    }
  },
  
  setUser: (user) => set({ user, initialized: true, loading: false }),
  clearUser: () => set({ user: null }),
}));
