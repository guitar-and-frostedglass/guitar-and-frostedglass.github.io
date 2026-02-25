import * as SecureStore from 'expo-secure-store'
import type { StorageAdapter, NavigationAdapter } from '../../shared/adapters'
import { navigationRef } from './navigation'

export const mobileTokenStorage: StorageAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
}

export const mobilePersistStorage: StorageAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
}

export const mobileNavigation: NavigationAdapter = {
  navigateTo: (path) => {
    if (path === '/login' && navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] })
    }
  },
}
