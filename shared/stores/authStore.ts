import type { User, LoginRequest, RegisterRequest } from '../types'
import type { AuthService } from '../services/authService'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  updateAvatar: (avatar: string) => Promise<void>
  updateProfile: (displayName: string, email: string) => Promise<void>
  logout: () => void
  clearError: () => void
  initAuth: () => Promise<void>
}

export function createAuthStoreSlice(
  authService: AuthService,
): (set: (partial: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>)) => void) => AuthState {
  return (set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,

    login: async (data: LoginRequest) => {
      set({ isLoading: true, error: null })
      try {
        const response = await authService.login(data)
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '登录失败'
        set({ error: message, isLoading: false })
        throw error
      }
    },

    register: async (data: RegisterRequest) => {
      set({ isLoading: true, error: null })
      try {
        const response = await authService.register(data)
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '注册失败'
        set({ error: message, isLoading: false })
        throw error
      }
    },

    updateAvatar: async (avatar: string) => {
      const updatedUser = await authService.updateAvatar(avatar)
      set({ user: updatedUser })
    },

    updateProfile: async (displayName: string, email: string) => {
      const updatedUser = await authService.updateProfile(displayName, email)
      set({ user: updatedUser })
    },

    logout: () => {
      authService.logout()
      set({ user: null, isAuthenticated: false, error: null })
    },

    clearError: () => {
      set({ error: null })
    },

    initAuth: async () => {
      const user = await authService.getCurrentUser()
      const isAuthenticated = await authService.isAuthenticated()
      set({ user, isAuthenticated, isInitialized: true })
    },
  })
}
