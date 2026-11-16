import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore has no web implementation; the web target is a dev vehicle, so
// plain localStorage is acceptable there.

const TOKEN_KEY = 'linernotes.token';
const USER_KEY = 'linernotes.user';

async function load(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function save(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // private window etc. — session just won't persist
    }
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}

export const loadStoredToken = () => load(TOKEN_KEY);
export const saveStoredToken = (t: string | null) => save(TOKEN_KEY, t);
export const loadStoredUser = () => load(USER_KEY);
export const saveStoredUser = (json: string | null) => save(USER_KEY, json);
