import { StyleSheet, ScrollView, View, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button, IconSymbol } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useServerStore, type Server } from '@/stores/server.store';
import { useColors, spacing, radii } from '@/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();

  const currentUser = useAuthStore((state) => state.currentUser);
  const credentials = useAuthStore((state) => state.credentials);
  const logout = useAuthStore((state) => state.logout);
  const servers = useServerStore((state) => state.servers);
  const currentServerId = useServerStore((state) => state.currentServerId);
  const getCurrentServer = useServerStore((state) => state.getCurrentServer);
  const setCurrentServer = useServerStore((state) => state.setCurrentServer);
  const removeServer = useServerStore((state) => state.removeServer);

  const currentServer = getCurrentServer();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          if (currentServer) {
            logout(currentServer.id);
            setCurrentServer(null);
          }
        },
      },
    ]);
  };

  const handleSwitchServer = (server: Server) => {
    if (server.id === currentServerId) return;

    // Check if we have credentials for this server
    const hasCredentials = !!credentials[server.id];

    if (hasCredentials) {
      // Switch to the server and reload app state
      setCurrentServer(server.id);
      // Navigate to home to refresh data
      router.replace('/(tabs)');
    } else {
      // Need to log in to this server
      setCurrentServer(server.id);
      router.replace('/(auth)/login');
    }
  };

  const handleRemoveServer = (server: Server) => {
    const isCurrentServer = server.id === currentServerId;
    const serverName = server.name || server.url;

    Alert.alert(
      'Remove Server',
      `Are you sure you want to remove "${serverName}"? ${isCurrentServer ? 'You will be signed out.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // Remove credentials if they exist
            if (credentials[server.id]) {
              logout(server.id);
            }
            // Remove the server
            removeServer(server.id);
            // If it was the current server, clear selection
            if (isCurrentServer) {
              setCurrentServer(null);
            }
          },
        },
      ]
    );
  };

  const handleAddServer = () => {
    router.push('/(auth)');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <ThemedText type="title" style={styles.title}>
          Settings
        </ThemedText>

        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
            Account
          </ThemedText>
          {currentUser && (
            <View
              style={[
                styles.accountInfo,
                { backgroundColor: colors.background.secondary, borderRadius: radii.md },
              ]}
            >
              <ThemedText style={styles.userName}>{currentUser.Name}</ThemedText>
              {currentServer && (
                <ThemedText style={[styles.serverName, { color: colors.text.secondary }]}>
                  {currentServer.name}
                </ThemedText>
              )}
            </View>
          )}
        </View>

        {/* Servers Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
            Servers
          </ThemedText>
          <View
            style={[
              styles.serversList,
              { backgroundColor: colors.background.secondary, borderRadius: radii.md },
            ]}
          >
            {servers.map((server, index) => {
              const isCurrentServer = server.id === currentServerId;
              const hasCredentials = !!credentials[server.id];

              return (
                <Pressable
                  key={server.id}
                  onPress={() => handleSwitchServer(server)}
                  style={({ pressed }) => [
                    styles.serverItem,
                    pressed && { backgroundColor: colors.interactive.secondaryHover },
                    index < servers.length - 1 && [
                      styles.serverItemBorder,
                      { borderBottomColor: colors.border.default },
                    ],
                  ]}
                >
                  <View style={styles.serverInfo}>
                    <View style={styles.serverNameRow}>
                      <ThemedText style={styles.serverItemName}>
                        {server.name || 'Jellyfin Server'}
                      </ThemedText>
                      {isCurrentServer && (
                        <IconSymbol
                          name="checkmark.circle.fill"
                          size={18}
                          color={colors.interactive.primary}
                        />
                      )}
                    </View>
                    <ThemedText style={[styles.serverItemUrl, { color: colors.text.secondary }]}>
                      {server.url}
                    </ThemedText>
                    {!hasCredentials && (
                      <ThemedText style={[styles.serverItemStatus, { color: colors.text.tertiary }]}>
                        Not signed in
                      </ThemedText>
                    )}
                  </View>
                  <Pressable
                    onPress={() => handleRemoveServer(server)}
                    hitSlop={8}
                    style={styles.removeButton}
                  >
                    <IconSymbol name="trash" size={18} color={colors.status.error} />
                  </Pressable>
                </Pressable>
              );
            })}
            {servers.length === 0 && (
              <View style={styles.emptyServers}>
                <ThemedText style={[styles.emptyText, { color: colors.text.tertiary }]}>
                  No servers configured
                </ThemedText>
              </View>
            )}
          </View>
          <Button
            variant="secondary"
            size="md"
            leftIcon="plus"
            fullWidth
            onPress={handleAddServer}
            style={styles.addServerButton}
          >
            Add Server
          </Button>
        </View>

        {/* Sign Out Button */}
        <Button variant="destructive" size="lg" fullWidth onPress={handleLogout}>
          Sign Out
        </Button>
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
    marginBottom: spacing['3xl'],
  },
  section: {
    marginBottom: spacing['3xl'],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  accountInfo: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  userName: {
    fontSize: 17,
    fontWeight: '500',
  },
  serverName: {
    fontSize: 15,
  },
  serversList: {
    overflow: 'hidden',
  },
  serverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  serverItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  serverInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  serverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  serverItemName: {
    fontSize: 17,
    fontWeight: '500',
  },
  serverItemUrl: {
    fontSize: 14,
  },
  serverItemStatus: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  removeButton: {
    padding: spacing.sm,
  },
  emptyServers: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  addServerButton: {
    marginTop: spacing.md,
  },
});
