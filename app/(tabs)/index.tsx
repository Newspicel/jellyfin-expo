import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MediaRow } from '@/components/media/media-row';
import { useAuthStore } from '@/stores/auth.store';
import { useServerStore } from '@/stores/server.store';
import {
  getResumeItemsOptions,
  getNextUpOptions,
  getLatestMediaOptions,
  getUserViewsOptions,
} from '@/api/generated/@tanstack/react-query.gen';
import { useState, useCallback } from 'react';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const currentServer = useServerStore((s) => s.getCurrentServer());
  const [refreshing, setRefreshing] = useState(false);

  // Get user views (libraries) to filter latest media
  const { data: userViews } = useQuery({
    ...getUserViewsOptions(),
    enabled: !!currentUser?.Id,
  });

  // Find movies and shows libraries
  const moviesLibrary = userViews?.Items?.find(
    (v) => v.CollectionType === 'movies'
  );
  const showsLibrary = userViews?.Items?.find(
    (v) => v.CollectionType === 'tvshows'
  );

  // Continue Watching - items the user has started but not finished
  const {
    data: resumeItems,
    isLoading: isLoadingResume,
    refetch: refetchResume,
  } = useQuery({
    ...getResumeItemsOptions({
      query: {
        limit: 12,
        mediaTypes: ['Video'],
        enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
        imageTypeLimit: 1,
      },
    }),
    enabled: !!currentUser?.Id,
  });

  // Next Up - next episodes to watch in series the user is watching
  const {
    data: nextUpItems,
    isLoading: isLoadingNextUp,
    refetch: refetchNextUp,
  } = useQuery({
    ...getNextUpOptions({
      query: {
        limit: 12,
        enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
        imageTypeLimit: 1,
      },
    }),
    enabled: !!currentUser?.Id,
  });

  // Latest Movies
  const {
    data: latestMovies,
    isLoading: isLoadingMovies,
    refetch: refetchMovies,
  } = useQuery({
    ...getLatestMediaOptions({
      query: {
        parentId: moviesLibrary?.Id,
        limit: 12,
        enableImageTypes: ['Primary', 'Backdrop'],
        imageTypeLimit: 1,
        includeItemTypes: ['Movie'],
      },
    }),
    enabled: !!moviesLibrary?.Id,
  });

  // Latest TV Shows
  const {
    data: latestShows,
    isLoading: isLoadingShows,
    refetch: refetchShows,
  } = useQuery({
    ...getLatestMediaOptions({
      query: {
        parentId: showsLibrary?.Id,
        limit: 12,
        enableImageTypes: ['Primary', 'Backdrop'],
        imageTypeLimit: 1,
        includeItemTypes: ['Series'],
      },
    }),
    enabled: !!showsLibrary?.Id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchResume(),
      refetchNextUp(),
      refetchMovies(),
      refetchShows(),
    ]);
    setRefreshing(false);
  }, [refetchResume, refetchNextUp, refetchMovies, refetchShows]);

  const userName = currentUser?.Name ?? 'User';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedText type="title" style={styles.greeting}>
          Hi, {userName}
        </ThemedText>

        {currentServer && (
          <ThemedText style={styles.serverName}>{currentServer.name}</ThemedText>
        )}

        <MediaRow
          title="Continue Watching"
          items={resumeItems?.Items}
          isLoading={isLoadingResume}
          showProgress={true}
        />

        <MediaRow
          title="Next Up"
          items={nextUpItems?.Items}
          isLoading={isLoadingNextUp}
          showProgress={false}
        />

        <MediaRow
          title="Latest Movies"
          items={latestMovies}
          isLoading={isLoadingMovies}
          showProgress={false}
        />

        <MediaRow
          title="Latest TV Shows"
          items={latestShows}
          isLoading={isLoadingShows}
          showProgress={false}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  greeting: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  serverName: {
    paddingHorizontal: 16,
    marginBottom: 24,
    opacity: 0.6,
    fontSize: 14,
  },
});
