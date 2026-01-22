import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useServerStore, type Server } from '@/stores/server.store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

function generateServerId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ServerSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [serverUrl, setServerUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const servers = useServerStore((state) => state.servers);
  const addServer = useServerStore((state) => state.addServer);
  const setCurrentServer = useServerStore((state) => state.setCurrentServer);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const handleConnect = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    let url = serverUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    // Remove trailing slash
    url = url.replace(/\/$/, '');

    setIsConnecting(true);

    try {
      const response = await fetch(`${url}/System/Info/Public`);
      if (!response.ok) {
        throw new Error('Failed to connect to server');
      }

      const info = await response.json();
      const serverName = info.ServerName ?? 'Jellyfin Server';

      const newServer: Server = {
        id: generateServerId(),
        name: serverName,
        url,
      };

      addServer(newServer);
      setCurrentServer(newServer.id);
      router.push('/(auth)/login');
    } catch {
      Alert.alert(
        'Connection Failed',
        'Could not connect to the server. Please check the URL and try again.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectServer = (server: Server) => {
    setCurrentServer(server.id);
    router.push('/(auth)/login');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title" style={styles.title}>
          Connect to Jellyfin
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Enter your server address to get started
        </ThemedText>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tint }]}
            placeholder="https://jellyfin.example.com"
            placeholderTextColor={`${colors.text}50`}
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handleConnect}
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color={colorScheme === 'dark' ? '#000' : '#fff'} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>
                Connect
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {servers.length > 0 && (
          <View style={styles.serversSection}>
            <ThemedText style={styles.sectionTitle}>Recent Servers</ThemedText>
            {servers.map((server) => (
              <TouchableOpacity
                key={server.id}
                style={styles.serverItem}
                onPress={() => handleSelectServer(server)}
              >
                <ThemedText style={styles.serverName}>{server.name}</ThemedText>
                <ThemedText style={styles.serverUrl}>{server.url}</ThemedText>
              </TouchableOpacity>
            ))}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 32,
  },
  inputContainer: {
    gap: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  serversSection: {
    marginTop: 48,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.5,
    marginBottom: 12,
  },
  serverItem: {
    padding: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
  },
  serverName: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 4,
  },
  serverUrl: {
    fontSize: 14,
    opacity: 0.6,
  },
});
