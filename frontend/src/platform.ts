import type { StorageAdapter, NavigationAdapter } from '../../shared/adapters'

export const webTokenStorage: StorageAdapter = {
  getItem: async (key) => sessionStorage.getItem(key),
  setItem: async (key, value) => { sessionStorage.setItem(key, value) },
  removeItem: async (key) => { sessionStorage.removeItem(key) },
}

export const webPersistStorage: StorageAdapter = {
  getItem: async (key) => localStorage.getItem(key),
  setItem: async (key, value) => { localStorage.setItem(key, value) },
  removeItem: async (key) => { localStorage.removeItem(key) },
}

export const webNavigation: NavigationAdapter = {
  navigateTo: (path) => { window.location.href = path },
}
