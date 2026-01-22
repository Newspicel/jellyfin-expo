import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useServerStore } from '@/stores/server.store';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getDeviceId, getDeviceName, getClientName, getClientVersion } from '@/lib/device';

export default function QuickConnectScreen() {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentServer = useServerStore((state) => state.getCurrentServer);
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);

  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const initiateQuickConnect = useCallback(async () => {
    const server = getCurrentServer();
    if (!server) {
      setError('No server selected');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if Quick Connect is enabled
      const enabledResponse = await fetch(`${server.url}/QuickConnect/Enabled`);
      if (!enabledResponse.ok) {
        throw new Error('Quick Connect is not available');
      }

      const isEnabled = await enabledResponse.json();
      if (!isEnabled) {
        throw new Error('Quick Connect is not enabled on this server');
      }

      // Initiate Quick Connect
      const deviceId = await getDeviceId();
      const deviceName = getDeviceName();
      const clientName = getClientName();
      const version = getClientVersion();

      const authHeader = `MediaBrowser Client="${clientName}", Device="${deviceName}", DeviceId="${deviceId}", Version="${version}"`;

      const initiateResponse = await fetch(`${server.url}/QuickConnect/Initiate`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
      });

      if (!initiateResponse.ok) {
        throw new Error('Failed to initiate Quick Connect');
      }

      const data = await initiateResponse.json();
      setCode(data.Code);
      setSecret(data.Secret);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate Quick Connect');
      setIsLoading(false);
    }
  }, [getCurrentServer]);

  const pollForAuth = useCallback(async () => {
    const server = getCurrentServer();
    if (!server || !secret) return;

    try {
      const deviceId = await getDeviceId();
      const deviceName = getDeviceName();
      const clientName = getClientName();
      const version = getClientVersion();

      const authHeader = `MediaBrowser Client="${clientName}", Device="${deviceName}", DeviceId="${deviceId}", Version="${version}"`;

      const response = await fetch(`${server.url}/QuickConnect/Connect?secret=${secret}`, {
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.Authenticated) {
        // Get auth result
        const authResponse = await fetch(
          `${server.url}/Users/AuthenticateWithQuickConnect`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: authHeader,
            },
            body: JSON.stringify({ Secret: secret }),
          }
        );

        if (authResponse.ok) {
          const authData = await authResponse.json();
          setCredentials(server.id, authData.AccessToken, authData.User.Id);
          setCurrentUser(authData.User);
          router.replace('/(tabs)');
        }
      }
    } catch {
      // Continue polling
    }
  }, [getCurrentServer, secret, setCredentials, setCurrentUser, router]);

  useEffect(() => {
    initiateQuickConnect();
  }, [initiateQuickConnect]);

  useEffect(() => {
    if (!secret) return;

    const interval = setInterval(pollForAuth, 2000);
    return () => clearInterval(interval);
  }, [secret, pollForAuth]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color={tintColor} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor }]}
              onPress={initiateQuickConnect}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.codeContainer}>
            <Text style={[styles.instructions, { color: textColor, opacity: 0.7 }]}>
              Enter this code in your Jellyfin server dashboard:
            </Text>
            <Text style={[styles.code, { color: tintColor }]}>{code}</Text>
            <Text style={[styles.waiting, { color: textColor, opacity: 0.6 }]}>
              Waiting for authorization...
            </Text>
            <ActivityIndicator
              size="small"
              color={tintColor}
              style={styles.waitingIndicator}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  codeContainer: {
    alignItems: 'center',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  code: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 8,
    marginBottom: 32,
  },
  waiting: {
    fontSize: 14,
    marginBottom: 16,
  },
  waitingIndicator: {
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    height: 50,
    paddingHorizontal: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
