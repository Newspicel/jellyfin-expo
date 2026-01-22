import { client } from './generated/client.gen';
import { useServerStore } from '@/stores/server.store';
import { useAuthStore } from '@/stores/auth.store';
import { getDeviceId, getDeviceName, getClientName, getClientVersion } from '@/lib/device';
import { queryClient } from '@/lib/query-client';

let isInitialized = false;
let cachedDeviceId: string | null = null;

export async function initializeApiClient(): Promise<void> {
  if (isInitialized) return;

  cachedDeviceId = await getDeviceId();
  isInitialized = true;
}

export function configureApiClient(): void {
  client.interceptors.request.use(async (request, options) => {
    const server = useServerStore.getState().getCurrentServer();
    if (!server) {
      return request;
    }

    // The generated client uses baseUrl 'http://localhost', so we need to replace it
    // with the actual server URL while preserving the path and query string
    const originalUrl = new URL(request.url);
    const serverUrl = new URL(server.url);

    // Replace origin (scheme + host) with actual server
    const fullUrl = `${serverUrl.origin}${originalUrl.pathname}${originalUrl.search}`;

    // Create a new request with the modified URL
    const newRequest = new Request(fullUrl, request);

    // Build authorization header
    const credentials = useAuthStore.getState().getCredentials(server.id);
    const deviceId = cachedDeviceId ?? (await getDeviceId());
    const deviceName = getDeviceName();
    const clientName = getClientName();
    const version = getClientVersion();

    let authValue = `MediaBrowser Client="${clientName}", Device="${deviceName}", DeviceId="${deviceId}", Version="${version}"`;

    if (credentials?.accessToken) {
      authValue += `, Token="${credentials.accessToken}"`;
    }

    newRequest.headers.set('Authorization', authValue);

    return newRequest;
  });

  client.interceptors.response.use((response) => {
    // Handle 401 Unauthorized - kick user out
    if (response.status === 401) {
      const server = useServerStore.getState().getCurrentServer();
      if (server) {
        // Full logout: clears credentials AND currentUser
        useAuthStore.getState().logout(server.id);
        // Clear all cached queries so stale auth data doesn't persist
        queryClient.clear();
      }
    }
    return response;
  });
}

/**
 * Get the cached device ID synchronously.
 * Returns null if not yet initialized (call initializeApiClient first).
 */
export function getCachedDeviceId(): string | null {
  return cachedDeviceId;
}

export { client };
