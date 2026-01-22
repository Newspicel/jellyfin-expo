import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

type SearchFilter = 'all' | 'movies' | 'series' | 'episodes' | 'people';

const MAX_RECENT_SEARCHES = 10;

interface SearchState {
  query: string;
  previousTab: string | null;
  activeFilter: SearchFilter;
  recentSearches: string[];
  setQuery: (query: string) => void;
  setPreviousTab: (tab: string) => void;
  setActiveFilter: (filter: SearchFilter) => void;
  clearQuery: () => void;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
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

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      query: '',
      previousTab: null,
      activeFilter: 'all',
      recentSearches: [],

      setQuery: (query) => set({ query }),
      setPreviousTab: (tab) => set({ previousTab: tab }),
      setActiveFilter: (filter) => set({ activeFilter: filter }),
      clearQuery: () => set({ query: '', activeFilter: 'all' }),

      addRecentSearch: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (trimmed.length < 2) return state;

          // Remove if exists (to move to front) and add at beginning
          const filtered = state.recentSearches.filter(
            (s) => s.toLowerCase() !== trimmed.toLowerCase()
          );
          const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
          return { recentSearches: updated };
        }),

      removeRecentSearch: (query) =>
        set((state) => ({
          recentSearches: state.recentSearches.filter(
            (s) => s.toLowerCase() !== query.toLowerCase()
          ),
        })),

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'jellyfin-search',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        recentSearches: state.recentSearches,
      }),
    }
  )
);
