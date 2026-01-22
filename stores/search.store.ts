import { create } from 'zustand';

interface SearchState {
  query: string;
  previousTab: string | null;
  setQuery: (query: string) => void;
  setPreviousTab: (tab: string) => void;
  clearQuery: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  previousTab: null,
  setQuery: (query) => set({ query }),
  setPreviousTab: (tab) => set({ previousTab: tab }),
  clearQuery: () => set({ query: '' }),
}));
