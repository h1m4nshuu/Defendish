import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_PORT = 5000;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function getExpoHost(): string | null {
  const constantsAny = Constants as any;
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ||
    constantsAny?.expoGoConfig?.debuggerHost ||
    constantsAny?.manifest2?.extra?.expoClient?.hostUri ||
    constantsAny?.manifest?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  const [host] = hostUri.split(':');
  return host || null;
}

function isPhysicalDevice(): boolean {
  const constantsAny = Constants as any;
  return Boolean(constantsAny?.isDevice);
}

export function getApiBaseUrl(): string {
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl) {
    return stripTrailingSlash(envApiUrl);
  }

  if (Platform.OS === 'web') {
    return `http://localhost:${DEFAULT_API_PORT}/api`;
  }

  const host = getExpoHost();

  if (Platform.OS === 'android') {
    if (isPhysicalDevice()) {
      if (host) {
        return `http://${host}:${DEFAULT_API_PORT}/api`;
      }
      return `http://localhost:${DEFAULT_API_PORT}/api`;
    }

    return `http://10.0.2.2:${DEFAULT_API_PORT}/api`;
  }

  if (host) {
    return `http://${host}:${DEFAULT_API_PORT}/api`;
  }

  return `http://localhost:${DEFAULT_API_PORT}/api`;
}

export function getApiBaseUrlCandidates(): string[] {
  const candidates: string[] = [];

  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl) {
    candidates.push(stripTrailingSlash(envApiUrl));
  }

  if (Platform.OS === 'web') {
    candidates.push(`http://localhost:${DEFAULT_API_PORT}/api`);
    return [...new Set(candidates)];
  }

  const host = getExpoHost();

  if (Platform.OS === 'android') {
    if (isPhysicalDevice()) {
      if (host) {
        candidates.push(`http://${host}:${DEFAULT_API_PORT}/api`);
      }
      candidates.push(`http://10.0.2.2:${DEFAULT_API_PORT}/api`);
    } else {
      candidates.push(`http://10.0.2.2:${DEFAULT_API_PORT}/api`);
      if (host) {
        candidates.push(`http://${host}:${DEFAULT_API_PORT}/api`);
      }
    }
  } else if (host) {
    candidates.push(`http://${host}:${DEFAULT_API_PORT}/api`);
  }

  candidates.push(`http://localhost:${DEFAULT_API_PORT}/api`);

  return [...new Set(candidates)];
}

export function getApiHostUrl(): string {
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace(/\/api$/, '');
}
