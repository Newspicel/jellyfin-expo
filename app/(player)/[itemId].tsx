import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PlayerScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.controls}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.placeholder}>Video Player</Text>
        <Text style={styles.itemId}>Item: {itemId}</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  controls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 12,
  },
  closeText: {
    color: '#fff',
    fontSize: 17,
  },
  placeholder: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  itemId: {
    color: '#fff',
    opacity: 0.6,
    marginTop: 8,
  },
});
