import { StyleSheet, ScrollView, View, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/stores/auth.store';
import { useServerStore } from '@/stores/server.store';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

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
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <ThemedText type="title" style={styles.title}>
          Settings
        </ThemedText>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          {currentUser && (
            <View style={styles.accountInfo}>
              <ThemedText style={styles.userName}>{currentUser.Name}</ThemedText>
              {server && (
                <ThemedText style={styles.serverName}>{server.name}</ThemedText>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutButtonText}>Sign Out</ThemedText>
        </TouchableOpacity>
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
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.5,
    marginBottom: 12,
  },
  accountInfo: {
    gap: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '500',
  },
  serverName: {
    fontSize: 15,
    opacity: 0.6,
  },
  logoutButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff3b30',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
