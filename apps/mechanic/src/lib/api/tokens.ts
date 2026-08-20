import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { TokenPair } from './types';

const ACCESS_KEY = 'autohelp.mechanic.jwt.access';
const REFRESH_KEY = 'autohelp.mechanic.jwt.refresh';

async function setSecure(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('JWT SecureStore is not used on web in this build.');
  }
  await SecureStore.setItemAsync(key, value);
}

async function getSecure(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(key);
}

async function deleteSecure(key: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(key);
}

export async function getAccessToken(): Promise<string | null> {
  return getSecure(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getSecure(REFRESH_KEY);
}

export async function setTokenPair(tokens: TokenPair): Promise<void> {
  await setSecure(ACCESS_KEY, tokens.access);
  await setSecure(REFRESH_KEY, tokens.refresh);
}

export async function setAccessToken(access: string): Promise<void> {
  await setSecure(ACCESS_KEY, access);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([deleteSecure(ACCESS_KEY), deleteSecure(REFRESH_KEY)]);
}
