import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useServerStore } from '@/stores/server.store';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getDeviceId, getDeviceName, getClientName, getClientVersion } from '@/lib/device';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentServer = useServerStore((state) => state.getCurrentServer);
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);

  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const handleLogin = async () => {
    const server = getCurrentServer();
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

  const server = getCurrentServer();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>Sign In</Text>
        {server && (
          <Text style={[styles.serverName, { color: textColor, opacity: 0.7 }]}>
            {server.name}
          </Text>
        )}

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: tintColor }]}
            placeholder="Username"
            placeholderTextColor={`${textColor}50`}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, { color: textColor, borderColor: tintColor }]}
            placeholder="Password"
            placeholderTextColor={`${textColor}50`}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: tintColor }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickConnectButton} onPress={handleQuickConnect}>
            <Text style={[styles.quickConnectText, { color: tintColor }]}>
              Use Quick Connect
            </Text>
          </TouchableOpacity>
        </View>
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
  serverName: {
    fontSize: 16,
    marginBottom: 32,
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
    color: '#fff',
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
