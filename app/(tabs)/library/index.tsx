import { StyleSheet, ScrollView, View, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/stores/auth.store';
import { useServerStore } from '@/stores/server.store';
import { getUserViewsOptions } from '@/api/generated/@tanstack/react-query.gen';
import type { BaseItemDto } from '@/api/generated';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { useColors, spacing, radii } from '@/theme';

// Map collection types to SF Symbols
function getLibraryIcon(collectionType: string | null | undefined): IconSymbolName {
  switch (collectionType) {
    case 'movies':
      return 'film.fill';
    case 'tvshows':
      return 'tv.fill';
    case 'music':
      return 'music.note.list';
    case 'books':
      return 'book.fill';
    case 'photos':
      return 'photo.fill';
    case 'homevideos':
      return 'video.fill';
    case 'boxsets':
      return 'rectangle.stack.fill';
    case 'playlists':
      return 'list.bullet';
    case 'livetv':
      return 'antenna.radiowaves.left.and.right';
    default:
      return 'folder.fill';
  }
}

interface LibraryCardProps {
  library: BaseItemDto;
}

function LibraryCard({ library }: LibraryCardProps) {
  const router = useRouter();
  const colors = useColors();

  const serverUrl = useServerStore.getState().getCurrentServer()?.url;

  // Try Primary image first, then Backdrop
  const primaryTag = library.ImageTags?.Primary;
  const backdropTag = library.BackdropImageTags?.[0];
  const imageTag = primaryTag || backdropTag;
  const imageType = primaryTag ? 'Primary' : 'Backdrop';

  const imageUrl = serverUrl && library.Id && imageTag
    ? `${serverUrl}/Items/${library.Id}/Images/${imageType}?tag=${imageTag}&maxWidth=400&quality=90`
    : serverUrl && library.Id
    ? `${serverUrl}/Items/${library.Id}/Images/Primary?maxWidth=400&quality=90`
    : null;

  const handlePress = () => {
    if (library.Id) {
      router.push(`/library/${library.Id}`);
    }
  };

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.background.secondary }]}
      onPress={handlePress}
    >
      <View style={styles.cardImageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.cardPlaceholder, { backgroundColor: colors.background.tertiary }]}>
            <IconSymbol
              name={getLibraryIcon(library.CollectionType)}
              size={40}
              color={colors.interactive.primary}
            />
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <ThemedText style={[styles.cardTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {library.Name}
        </ThemedText>
        {library.ChildCount !== undefined && (
          <ThemedText style={[styles.cardSubtitle, { color: colors.text.tertiary }]}>
            {library.ChildCount} {library.ChildCount === 1 ? 'item' : 'items'}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

export default function LibraryListScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const colors = useColors();

  const { data: userViews, isLoading, error } = useQuery({
    ...getUserViewsOptions(),
    enabled: !!currentUser?.Id,
  });

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text.secondary} />
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.text.tertiary} />
          <ThemedText style={[styles.errorText, { color: colors.text.secondary }]}>
            Failed to load libraries
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const libraries = userViews?.Items ?? [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.title}>
          Library
        </ThemedText>

        <View style={styles.grid}>
          {libraries.map((library) => (
            <LibraryCard key={library.Id} library={library} />
          ))}
        </View>

        {libraries.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="folder" size={48} color={colors.text.tertiary} />
            <ThemedText style={[styles.emptyText, { color: colors.text.secondary }]}>
              No libraries found
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  title: {
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47.5%',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  cardImageContainer: {
    aspectRatio: 16 / 10,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: spacing.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
