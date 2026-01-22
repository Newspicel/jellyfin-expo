import { StyleSheet, ScrollView, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useServerStore } from '@/stores/server.store';
import { useColors, spacing, radii } from '@/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const getCurrentServer = useServerStore((state) => state.getCurrentServer);
  const setCurrentServer = useServerStore((state) => state.setCurrentServer);

  const server = getCurrentServer();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          if (server) {
            logout(server.id);
            setCurrentServer(null);
          }
        },
      },
    ]);
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
              {server && (
                <ThemedText style={[styles.serverName, { color: colors.text.secondary }]}>
                  {server.name}
                </ThemedText>
              )}
            </View>
          )}
        </View>

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
});
