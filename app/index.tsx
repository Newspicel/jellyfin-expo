import { Redirect } from 'expo-router';

import { useAuthStore } from '@/stores/auth.store';
import { useServerStore } from '@/stores/server.store';

export default function IndexRedirect() {
  const getCredentials = useAuthStore((s) => s.getCredentials);
  const currentServerId = useServerStore((s) => s.currentServerId);

  const hasValidAuth = currentServerId !== null && getCredentials(currentServerId) !== null;

  if (hasValidAuth) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}
