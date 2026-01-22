import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { getItemOptions } from '@/api/generated/@tanstack/react-query.gen';

export default function EpisodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: item, isLoading } = useQuery({
    ...getItemOptions({
      path: { itemId: id! },
    }),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );
  }

  const episodeInfo = item?.IndexNumber
    ? `S${item.ParentIndexNumber ?? 0}E${item.IndexNumber}`
    : '';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: item?.Name ?? 'Episode' }} />
      <View style={styles.content}>
        <ThemedText type="title">{item?.Name}</ThemedText>
        {item?.SeriesName && (
          <ThemedText style={styles.seriesName}>
            {item.SeriesName} {episodeInfo}
          </ThemedText>
        )}
        {item?.Overview && (
          <ThemedText style={styles.overview}>{item.Overview}</ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 120,
  },
  seriesName: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  overview: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 16,
    opacity: 0.9,
  },
});
