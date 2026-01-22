import { useState, useEffect } from 'react';
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
import { Image } from 'expo-image';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useServerStore } from '@/stores/server.store';
import { useAuthStore } from '@/stores/auth.store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getDeviceId, getDeviceName, getClientName, getClientVersion } from '@/lib/device';
import type { UserDto } from '@/api/generated';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [publicUsers, setPublicUsers] = useState<UserDto[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const getCurrentServer = useServerStore((state) => state.getCurrentServer);
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const server = getCurrentServer();

  // Fetch public users when screen loads
  useEffect(() => {
    async function fetchPublicUsers() {
      if (!server) return;
      try {
        const response = await fetch(`${server.url}/Users/Public`);
        if (response.ok) {
          const users = await response.json();
          setPublicUsers(users);
        }
      } catch {
        // Silently fail - users can still type their username
      }
    }
    fetchPublicUsers();
  }, [server]);

  const handleSelectUser = (user: UserDto) => {
    setUsername(user.Name ?? '');
    setSelectedUserId(user.Id ?? null);
  };

  const getUserImageUrl = (user: UserDto) => {
    if (!server || !user.Id || !user.PrimaryImageTag) return null;
    return `${server.url}/Users/${user.Id}/Images/Primary?tag=${user.PrimaryImageTag}&maxWidth=200&quality=90`;
  };

  const handleLogin = async () => {
    if (!server) {
      Alert.alert('Error', 'No server selected');
      router.back();
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }

    setIsLoading(true);

    try {
      const deviceId = await getDeviceId();
      const deviceName = getDeviceName();
      const clientName = getClientName();
      const version = getClientVersion();

      const authHeader = `MediaBrowser Client="${clientName}", Device="${deviceName}", DeviceId="${deviceId}", Version="${version}"`;

      const response = await fetch(`${server.url}/Users/AuthenticateByName`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          Username: username,
          Pw: password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid username or password');
        }
        throw new Error('Authentication failed');
      }

      const data = await response.json();

      if (!data.AccessToken || !data.User?.Id) {
        throw new Error('Invalid response from server');
      }

      setCredentials(server.id, data.AccessToken, data.User.Id);
      setCurrentUser(data.User);

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      Alert.alert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickConnect = () => {
    router.push('/(auth)/quick-connect');
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
          Sign In
        </ThemedText>
        {server && (
          <ThemedText style={styles.serverName}>{server.name}</ThemedText>
        )}

        {publicUsers.length > 0 && (
          <View style={styles.usersSection}>
            <ThemedText style={styles.sectionTitle}>Select User</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.usersRow}
            >
              {publicUsers.map((user) => {
                const imageUrl = getUserImageUrl(user);
                const isSelected = selectedUserId === user.Id;
                return (
                  <TouchableOpacity
                    key={user.Id}
                    style={[
                      styles.userCard,
                      isSelected && { borderColor: colors.tint, borderWidth: 2 },
                    ]}
                    onPress={() => handleSelectUser(user)}
                  >
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.userAvatar}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                        <ThemedText style={styles.userAvatarInitial}>
                          {(user.Name ?? '?')[0].toUpperCase()}
                        </ThemedText>
                      </View>
                    )}
                    <ThemedText style={styles.userCardName} numberOfLines={1}>
                      {user.Name}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tint }]}
            placeholder="Username"
            placeholderTextColor={`${colors.text}50`}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setSelectedUserId(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tint }]}
            placeholder="Password"
            placeholderTextColor={`${colors.text}50`}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colorScheme === 'dark' ? '#000' : '#fff'} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>
                Sign In
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickConnectButton} onPress={handleQuickConnect}>
            <ThemedText style={[styles.quickConnectText, { color: colors.tint }]}>
              Use Quick Connect
            </ThemedText>
          </TouchableOpacity>
        </View>
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
  serverName: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 32,
  },
  usersSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.5,
    marginBottom: 12,
  },
  usersRow: {
    gap: 12,
  },
  userCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    width: 100,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  userAvatarPlaceholder: {
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarInitial: {
    fontSize: 24,
    fontWeight: '600',
  },
  userCardName: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
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
    marginTop: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  quickConnectButton: {
    alignItems: 'center',
    padding: 16,
  },
  quickConnectText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
