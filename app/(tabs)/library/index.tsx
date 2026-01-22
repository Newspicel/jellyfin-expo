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
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

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
  const colorScheme = useColorScheme();
  const iconColor = Colors[colorScheme ?? 'dark'].tint;

  const serverUrl = useServerStore.getState().getCurrentServer()?.url;
  const imageTag = library.ImageTags?.Primary;
  const imageUrl = serverUrl && library.Id && imageTag
    ? `${serverUrl}/Items/${library.Id}/Images/Primary?tag=${imageTag}&maxWidth=400&quality=90`
    : null;

  const handlePress = () => {
    if (library.Id) {
      router.push(`/library/${library.Id}`);
    }
  };

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      <View style={styles.cardImageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.cardPlaceholder}>
            <IconSymbol
              name={getLibraryIcon(library.CollectionType)}
              size={48}
              color={iconColor}
            />
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <ThemedText style={styles.cardTitle} numberOfLines={1}>
          {library.Name}
        </ThemedText>
        {library.ChildCount !== undefined && (
          <ThemedText style={styles.cardSubtitle}>
            {library.ChildCount} items
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

export default function LibraryListScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);

  const { data: userViews, isLoading, error } = useQuery({
    ...getUserViewsOptions(),
    enabled: !!currentUser?.Id,
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

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText>Failed to load libraries</ThemedText>
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
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
        ]}
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
            <ThemedText>No libraries found</ThemedText>
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
    paddingHorizontal: 16,
  },
  title: {
    marginBottom: 16,
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  cardImageContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
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
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
});
