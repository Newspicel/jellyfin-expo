import { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button, Input } from '@/components/ui';
import { useServerStore, type Server } from '@/stores/server.store';
import { useColors, spacing, radii } from '@/theme';

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
  const colors = useColors();
  const [serverUrl, setServerUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const servers = useServerStore((state) => state.servers);
  const addServer = useServerStore((state) => state.addServer);
  const setCurrentServer = useServerStore((state) => state.setCurrentServer);

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
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title" style={styles.title}>
          Connect to Jellyfin
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.text.secondary }]}>
          Enter your server address to get started
        </ThemedText>

        <View style={styles.inputContainer}>
          <Input
            placeholder="https://jellyfin.example.com"
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handleConnect}
          />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isConnecting}
            onPress={handleConnect}
          >
            Connect
          </Button>
        </View>

        {servers.length > 0 && (
          <View style={styles.serversSection}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
              Recent Servers
            </ThemedText>
            {servers.map((server) => (
              <Pressable
                key={server.id}
                style={[styles.serverItem, { backgroundColor: colors.background.secondary }]}
                onPress={() => handleSelectServer(server)}
              >
                <ThemedText style={styles.serverName}>{server.name}</ThemedText>
                <ThemedText style={[styles.serverUrl, { color: colors.text.secondary }]}>
                  {server.url}
                </ThemedText>
              </Pressable>
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
    paddingHorizontal: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing['3xl'],
  },
  inputContainer: {
    gap: spacing.lg,
  },
  serversSection: {
    marginTop: spacing['5xl'],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  serverItem: {
    padding: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  serverName: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  serverUrl: {
    fontSize: 14,
  },
});
