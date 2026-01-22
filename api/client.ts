import { client } from './generated/client.gen';
import { useServerStore } from '@/stores/server.store';
import { useAuthStore } from '@/stores/auth.store';
import { getDeviceId, getDeviceName, getClientName, getClientVersion } from '@/lib/device';

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

    // Build the full URL by prepending server URL to the path
    const originalUrl = request.url;
    const fullUrl = originalUrl.startsWith('http')
      ? originalUrl
      : `${server.url}${originalUrl.startsWith('/') ? '' : '/'}${originalUrl}`;

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
    // Handle 401 Unauthorized
    if (response.status === 401) {
      const server = useServerStore.getState().getCurrentServer();
      if (server) {
        useAuthStore.getState().removeCredentials(server.id);
      }
    }
    return response;
  });
}

export { client };
