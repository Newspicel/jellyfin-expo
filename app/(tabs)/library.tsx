import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LibraryScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Library</ThemedText>
      <ThemedText>Browse your media libraries here.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
