import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { UserDto } from '@/api/generated';

interface AuthCredentials {
  serverId: string;
  accessToken: string;
  userId: string;
}

interface AuthState {
  credentials: Record<string, AuthCredentials>; // keyed by serverId
  currentUser: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setCredentials: (serverId: string, accessToken: string, userId: string) => void;
  getCredentials: (serverId: string) => AuthCredentials | null;
  removeCredentials: (serverId: string) => void;
  setCurrentUser: (user: UserDto | null) => void;
  setIsLoading: (loading: boolean) => void;
  logout: (serverId: string) => void;
  logoutAll: () => void;
}

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      console.warn('SecureStore not available');
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      // Ignore
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      credentials: {},
      currentUser: null,
      isAuthenticated: false,
      isLoading: true,

      setCredentials: (serverId, accessToken, userId) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            [serverId]: { serverId, accessToken, userId },
          },
          isAuthenticated: true,
        })),

      getCredentials: (serverId) => {
        const state = get();
        return state.credentials[serverId] ?? null;
      },

      removeCredentials: (serverId) =>
        set((state) => {
          const { [serverId]: _, ...rest } = state.credentials;
          return {
            credentials: rest,
            isAuthenticated: Object.keys(rest).length > 0,
          };
        }),

      setCurrentUser: (user) => set({ currentUser: user }),

      setIsLoading: (loading) => set({ isLoading: loading }),

      logout: (serverId) => {
        const state = get();
        state.removeCredentials(serverId);
        set({ currentUser: null });
      },

      logoutAll: () =>
        set({
          credentials: {},
          currentUser: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'jellyfin-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        credentials: state.credentials,
      }),
    }
  )
);
