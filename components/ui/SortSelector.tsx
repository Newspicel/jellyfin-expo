/**
 * SortSelector - Modal for selecting sort options in library views
 *
 * Displays available sort options and allows users to select one.
 */

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from './icon-symbol';
import { spacing, radii, fontSizes, fontWeights } from '@/theme/tokens';
import { useColors } from '@/theme';
import type { ItemSortBy, SortOrder } from '@/api/generated/types.gen';

// =============================================================================
// TYPES
// =============================================================================

export interface SortOption {
  id: string;
  label: string;
  sortBy: ItemSortBy;
  sortOrder: SortOrder;
}

export interface SortSelectorProps {
  /** Whether the selector is visible */
  visible: boolean;
  /** Available sort options */
  options: SortOption[];
  /** Currently selected option id */
  selectedId: string;
  /** Called when an option is selected */
  onSelect: (option: SortOption) => void;
  /** Called to close the selector */
  onClose: () => void;
}

// =============================================================================
// DEFAULT SORT OPTIONS
// =============================================================================

export const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { id: 'name-asc', label: 'Name (A-Z)', sortBy: 'SortName', sortOrder: 'Ascending' },
  { id: 'name-desc', label: 'Name (Z-A)', sortBy: 'SortName', sortOrder: 'Descending' },
  { id: 'date-added-desc', label: 'Date Added (Newest)', sortBy: 'DateCreated', sortOrder: 'Descending' },
  { id: 'date-added-asc', label: 'Date Added (Oldest)', sortBy: 'DateCreated', sortOrder: 'Ascending' },
  { id: 'release-desc', label: 'Release Date (Newest)', sortBy: 'PremiereDate', sortOrder: 'Descending' },
  { id: 'release-asc', label: 'Release Date (Oldest)', sortBy: 'PremiereDate', sortOrder: 'Ascending' },
  { id: 'rating-desc', label: 'Rating (Highest)', sortBy: 'CommunityRating', sortOrder: 'Descending' },
  { id: 'rating-asc', label: 'Rating (Lowest)', sortBy: 'CommunityRating', sortOrder: 'Ascending' },
  { id: 'random', label: 'Random', sortBy: 'Random', sortOrder: 'Ascending' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function SortSelector({
  visible,
  options,
  selectedId,
  onSelect,
  onClose,
}: SortSelectorProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const handleSelectOption = (option: SortOption) => {
    onSelect(option);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
          // Prevent closing when tapping inside the modal
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border.default }]}>
            <Text style={[styles.title, { color: colors.text.primary }]}>Sort By</Text>
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.background.tertiary }]}
              onPress={onClose}
            >
              <IconSymbol name="xmark" size={20} color={colors.text.primary} />
            </Pressable>
          </View>

          {/* Options list */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {options.map((option) => {
              const isSelected = option.id === selectedId;

              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.optionItem,
                    isSelected ? { backgroundColor: colors.interactive.primary + '20' } : null,
                  ]}
                  onPress={() => handleSelectOption(option)}
                >
                  <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <IconSymbol name="checkmark" size={20} color={colors.interactive.primary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
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
    maxHeight: '60%',
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
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingVertical: spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionLabel: {
    fontSize: fontSizes.base,
  },
});

export default SortSelector;
