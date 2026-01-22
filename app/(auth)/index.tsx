import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useServerStore, type Server } from '@/stores/server.store';
import { useThemeColor } from '@/hooks/use-theme-color';

function generateServerId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ServerSelectScreen() {
  const router = useRouter();
  const [serverUrl, setServerUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const servers = useServerStore((state) => state.servers);
  const addServer = useServerStore((state) => state.addServer);
  const setCurrentServer = useServerStore((state) => state.setCurrentServer);

  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

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
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>Connect to Jellyfin</Text>
        <Text style={[styles.subtitle, { color: textColor, opacity: 0.7 }]}>
          Enter your server address to get started
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: tintColor }]}
            placeholder="https://jellyfin.example.com"
            placeholderTextColor={`${textColor}50`}
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handleConnect}
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: tintColor }]}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Connect</Text>
            )}
          </TouchableOpacity>
        </View>

        {servers.length > 0 && (
          <View style={styles.serversSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Servers</Text>
            <FlatList
              data={servers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.serverItem, { borderColor: `${textColor}20` }]}
                  onPress={() => handleSelectServer(item)}
                >
                  <Text style={[styles.serverName, { color: textColor }]}>{item.name}</Text>
                  <Text style={[styles.serverUrl, { color: textColor, opacity: 0.6 }]}>
                    {item.url}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  serversSection: {
    marginTop: 48,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  serverItem: {
    padding: 16,
    borderWidth: 1,
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
  },
});
