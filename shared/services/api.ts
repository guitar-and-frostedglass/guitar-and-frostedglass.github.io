import type { StorageAdapter, NavigationAdapter } from '../adapters'

export interface ApiClient {
  get<T = unknown>(url: string): Promise<{ data: T }>
  post<T = unknown>(url: string, data?: unknown): Promise<{ data: T }>
  put<T = unknown>(url: string, data?: unknown): Promise<{ data: T }>
  delete<T = unknown>(url: string): Promise<{ data: T }>
}

export function setupApiInterceptors(
  client: any,
  tokenStorage: StorageAdapter,
  navigation: NavigationAdapter,
): void {
  client.interceptors.request.use(
    async (config: any) => {
      const token = await tokenStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error: any) => Promise.reject(error),
  )

  client.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      if (error.response?.status === 401 && (await tokenStorage.getItem('token'))) {
        await tokenStorage.removeItem('token')
        await tokenStorage.removeItem('user')
        navigation.navigateTo('/login')
      }
      const serverMessage = error.response?.data?.error
      if (serverMessage) {
        return Promise.reject(new Error(serverMessage))
      }
      return Promise.reject(error)
    },
  )
}
