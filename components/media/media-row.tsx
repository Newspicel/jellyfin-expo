import { StyleSheet, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter, Href } from 'expo-router';
import type { BaseItemDto } from '@/api/generated';
import { ThemedText } from '@/components/themed-text';
import { PosterCard } from './poster-card';
import { useColors } from '@/theme';

interface MediaRowProps {
  title: string;
  items: BaseItemDto[] | undefined;
  isLoading?: boolean;
  cardWidth?: number;
  showProgress?: boolean;
  seeAllHref?: Href;
}

export function MediaRow({
  title,
  items,
  isLoading = false,
  cardWidth = 120,
  showProgress = true,
  seeAllHref,
}: MediaRowProps) {
  const router = useRouter();
  const colors = useColors();

  // Don't render anything if there's no data and not loading
  if (!isLoading && (!items || items.length === 0)) {
    return null;
  }

  const handleSeeAllPress = () => {
    if (seeAllHref) {
      router.push(seeAllHref);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        {seeAllHref && (
          <Pressable onPress={handleSeeAllPress} hitSlop={8}>
            <ThemedText style={[styles.seeAllText, { color: colors.interactive.primary }]}>
              See All
            </ThemedText>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {items?.map((item, index) => (
            <View key={item.Id} style={index < items.length - 1 ? styles.cardWrapper : undefined}>
              <PosterCard
                item={item}
                width={cardWidth}
                showProgress={showProgress}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    flex: 1,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  cardWrapper: {
    marginRight: 12,
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
