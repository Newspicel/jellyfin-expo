import { create } from 'zustand';

type SearchFilter = 'all' | 'movies' | 'series' | 'episodes' | 'people';

interface SearchState {
  query: string;
  previousTab: string | null;
  activeFilter: SearchFilter;
  setQuery: (query: string) => void;
  setPreviousTab: (tab: string) => void;
  setActiveFilter: (filter: SearchFilter) => void;
  clearQuery: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  previousTab: null,
  activeFilter: 'all',
  setQuery: (query) => set({ query }),
  setPreviousTab: (tab) => set({ previousTab: tab }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  clearQuery: () => set({ query: '', activeFilter: 'all' }),
}));
