/**
 * FilterSelector - Modal for selecting filter options in library views
 *
 * Displays available filter options (genres, years) and allows users to select multiple.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from './icon-symbol';
import { spacing, radii, fontSizes, fontWeights } from '@/theme/tokens';
import { useColors } from '@/theme';
import { getQueryFiltersLegacyOptions } from '@/api/generated/@tanstack/react-query.gen';
import type { BaseItemKind } from '@/api/generated/types.gen';
import { useAuthStore } from '@/stores/auth.store';

// =============================================================================
// TYPES
// =============================================================================

export interface FilterState {
  genres: string[];
  years: number[];
}

export interface FilterSelectorProps {
  /** Whether the selector is visible */
  visible: boolean;
  /** Parent library ID to fetch filters for */
  parentId: string;
  /** Item types to filter by (for fetching relevant filters) */
  includeItemTypes?: BaseItemKind[];
  /** Currently active filters */
  activeFilters: FilterState;
  /** Called when filters are applied */
  onApply: (filters: FilterState) => void;
  /** Called to close the selector */
  onClose: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function FilterSelector({
  visible,
  parentId,
  includeItemTypes,
  activeFilters,
  onApply,
  onClose,
}: FilterSelectorProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const currentUser = useAuthStore((s) => s.currentUser);

  // Local state for selections (before applying)
  const [selectedGenres, setSelectedGenres] = useState<string[]>(activeFilters.genres);
  const [selectedYears, setSelectedYears] = useState<number[]>(activeFilters.years);

  // Fetch available filters for this library
  const { data: filtersData, isLoading } = useQuery({
    ...getQueryFiltersLegacyOptions({
      query: {
        userId: currentUser?.Id,
        parentId,
        includeItemTypes,
      },
    }),
    enabled: visible && !!parentId && !!currentUser?.Id,
  });

  // Sync local state when modal opens with new activeFilters
  const handleModalShow = useCallback(() => {
    setSelectedGenres(activeFilters.genres);
    setSelectedYears(activeFilters.years);
  }, [activeFilters]);

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }, []);

  const toggleYear = useCallback((year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  }, []);

  const clearAll = useCallback(() => {
    setSelectedGenres([]);
    setSelectedYears([]);
  }, []);

  const handleApply = useCallback(() => {
    onApply({
      genres: selectedGenres,
      years: selectedYears,
    });
    onClose();
  }, [selectedGenres, selectedYears, onApply, onClose]);

  const hasActiveFilters = selectedGenres.length > 0 || selectedYears.length > 0;
  const genres = filtersData?.Genres ?? [];
  const years = (filtersData?.Years ?? []).sort((a, b) => b - a); // Sort descending

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={handleModalShow}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.container,
            {
              paddingBottom: insets.bottom + spacing.lg,
              backgroundColor: colors.background.secondary,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border.default }]}>
            <Text style={[styles.title, { color: colors.text.primary }]}>Filters</Text>
            <View style={styles.headerActions}>
              {hasActiveFilters && (
                <Pressable
                  style={[styles.clearButton, { backgroundColor: colors.background.tertiary }]}
                  onPress={clearAll}
                >
                  <Text style={[styles.clearButtonText, { color: colors.text.secondary }]}>
                    Clear
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.closeButton, { backgroundColor: colors.background.tertiary }]}
                onPress={onClose}
              >
                <IconSymbol name="xmark" size={20} color={colors.text.primary} />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.text.secondary} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Genres Section */}
              {genres.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
                    Genres
                  </Text>
                  <View style={styles.chipContainer}>
                    {genres.map((genre) => {
                      const isSelected = selectedGenres.includes(genre);
                      return (
                        <Pressable
                          key={genre}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected
                                ? colors.interactive.primary
                                : colors.background.tertiary,
                            },
                          ]}
                          onPress={() => toggleGenre(genre)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: isSelected
                                  ? colors.text.inverse
                                  : colors.text.primary,
                              },
                            ]}
                          >
                            {genre}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Years Section */}
              {years.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
                    Years
                  </Text>
                  <View style={styles.chipContainer}>
                    {years.map((year) => {
                      const isSelected = selectedYears.includes(year);
                      return (
                        <Pressable
                          key={year}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected
                                ? colors.interactive.primary
                                : colors.background.tertiary,
                            },
                          ]}
                          onPress={() => toggleYear(year)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: isSelected
                                  ? colors.text.inverse
                                  : colors.text.primary,
                              },
                            ]}
                          >
                            {year}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Empty state */}
              {genres.length === 0 && years.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                    No filters available for this library
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Apply Button */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.applyButton, { backgroundColor: colors.interactive.primary }]}
              onPress={handleApply}
            >
              <Text style={[styles.applyButtonText, { color: colors.text.inverse }]}>
                Apply Filters
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  clearButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  chipText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSizes.base,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  applyButton: {
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
});

export default FilterSelector;
