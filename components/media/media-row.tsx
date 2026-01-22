import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import type { BaseItemDto } from '@/api/generated';
import { ThemedText } from '@/components/themed-text';
import { PosterCard } from './poster-card';

interface MediaRowProps {
  title: string;
  items: BaseItemDto[] | undefined;
  isLoading?: boolean;
  cardWidth?: number;
  showProgress?: boolean;
}

export function MediaRow({
  title,
  items,
  isLoading = false,
  cardWidth = 120,
  showProgress = true,
}: MediaRowProps) {
  // Don't render anything if there's no data and not loading
  if (!isLoading && (!items || items.length === 0)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>

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
          {items?.map((item) => (
            <PosterCard
              key={item.Id}
              item={item}
              width={cardWidth}
              showProgress={showProgress}
            />
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
  title: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
