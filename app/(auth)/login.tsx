import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button, Input } from '@/components/ui';
import { useServerStore } from '@/stores/server.store';
import { useAuthStore } from '@/stores/auth.store';
import { useColors, spacing, radii } from '@/theme';
import { getDeviceId, getDeviceName, getClientName, getClientVersion } from '@/lib/device';
import type { UserDto } from '@/api/generated';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [publicUsers, setPublicUsers] = useState<UserDto[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const getCurrentServer = useServerStore((state) => state.getCurrentServer);
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);

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
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title" style={styles.title}>
          Sign In
        </ThemedText>
        {server && (
          <ThemedText style={[styles.serverName, { color: colors.text.secondary }]}>
            {server.name}
          </ThemedText>
        )}

        {publicUsers.length > 0 && (
          <View style={styles.usersSection}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
              Select User
            </ThemedText>
            <View style={styles.usersGrid}>
              {publicUsers.map((user) => {
                const imageUrl = getUserImageUrl(user);
                const isSelected = selectedUserId === user.Id;
                return (
                  <Pressable
                    key={user.Id}
                    style={[
                      styles.userCard,
                      { backgroundColor: colors.background.secondary },
                      isSelected && {
                        borderColor: colors.interactive.primary,
                        borderWidth: 2,
                      },
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
                      <View
                        style={[
                          styles.userAvatar,
                          styles.userAvatarPlaceholder,
                          { backgroundColor: colors.background.tertiary },
                        ]}
                      >
                        <ThemedText style={styles.userAvatarInitial}>
                          {(user.Name ?? '?')[0].toUpperCase()}
                        </ThemedText>
                      </View>
                    )}
                    <ThemedText style={styles.userCardName} numberOfLines={1}>
                      {user.Name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.form}>
          <Input
            placeholder="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setSelectedUserId(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={handleLogin}
            style={styles.signInButton}
          >
            Sign In
          </Button>

          <Button
            variant="ghost"
            onPress={handleQuickConnect}
            style={styles.quickConnectButton}
          >
            Use Quick Connect
          </Button>
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
    paddingHorizontal: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  serverName: {
    fontSize: 16,
    marginBottom: spacing['3xl'],
  },
  usersSection: {
    marginBottom: spacing['3xl'],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  usersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  userCard: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    width: 100,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
  },
  userAvatarPlaceholder: {
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
    gap: spacing.lg,
  },
  signInButton: {
    marginTop: spacing.sm,
  },
  quickConnectButton: {
    alignSelf: 'center',
  },
});
