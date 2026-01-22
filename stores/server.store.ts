import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export interface Server {
  id: string;
  name: string;
  url: string;
}

interface ServerState {
  servers: Server[];
  currentServerId: string | null;

  addServer: (server: Server) => void;
  removeServer: (id: string) => void;
  setCurrentServer: (id: string | null) => void;
  updateServer: (id: string, updates: Partial<Server>) => void;
  getCurrentServer: () => Server | null;
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
      // Fallback for platforms without SecureStore
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

export const useServerStore = create<ServerState>()(
  persist(
    (set, get) => ({
      servers: [],
      currentServerId: null,

      addServer: (server) =>
        set((state) => {
          const exists = state.servers.some((s) => s.id === server.id);
          if (exists) {
            return state;
          }
          return { servers: [...state.servers, server] };
        }),

      removeServer: (id) =>
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== id),
          currentServerId: state.currentServerId === id ? null : state.currentServerId,
        })),

      setCurrentServer: (id) => set({ currentServerId: id }),

      updateServer: (id, updates) =>
        set((state) => ({
          servers: state.servers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      getCurrentServer: () => {
        const state = get();
        return state.servers.find((s) => s.id === state.currentServerId) ?? null;
      },
    }),
    {
      name: 'jellyfin-servers',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
