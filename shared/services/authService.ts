import type { ApiClient } from './api'
import type { StorageAdapter } from '../adapters'
import type { LoginRequest, RegisterRequest, AuthResponse, User, ApiResponse } from '../types'

export interface AuthService {
  login(data: LoginRequest): Promise<AuthResponse>
  register(data: RegisterRequest): Promise<AuthResponse>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
  isAuthenticated(): Promise<boolean>
  updateAvatar(avatar: string): Promise<User>
  changePassword(currentPassword: string, newPassword: string): Promise<void>
  updateProfile(displayName: string, email: string): Promise<User>
}

export function createAuthService(api: ApiClient, tokenStorage: StorageAdapter): AuthService {
  return {
    async login(data: LoginRequest): Promise<AuthResponse> {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data)
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data
        await tokenStorage.setItem('token', token)
        await tokenStorage.setItem('user', JSON.stringify(user))
        return response.data.data
      }
      throw new Error(response.data.error || '登录失败')
    },

    async register(data: RegisterRequest): Promise<AuthResponse> {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data)
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data
        await tokenStorage.setItem('token', token)
        await tokenStorage.setItem('user', JSON.stringify(user))
        return response.data.data
      }
      throw new Error(response.data.error || '注册失败')
    },

    async logout(): Promise<void> {
      await tokenStorage.removeItem('token')
      await tokenStorage.removeItem('user')
    },

    async getCurrentUser(): Promise<User | null> {
      const userStr = await tokenStorage.getItem('user')
      if (userStr) {
        try {
          return JSON.parse(userStr)
        } catch {
          return null
        }
      }
      return null
    },

    async isAuthenticated(): Promise<boolean> {
      return !!(await tokenStorage.getItem('token'))
    },

    async updateAvatar(avatar: string): Promise<User> {
      const response = await api.put<ApiResponse<User>>('/auth/avatar', { avatar })
      if (response.data.success && response.data.data) {
        await tokenStorage.setItem('user', JSON.stringify(response.data.data))
        return response.data.data
      }
      throw new Error(response.data.error || '更新头像失败')
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
      const response = await api.put<ApiResponse<null>>('/auth/password', { currentPassword, newPassword })
      if (!response.data.success) {
        throw new Error(response.data.error || '修改密码失败')
      }
    },

    async updateProfile(displayName: string, email: string): Promise<User> {
      const response = await api.put<ApiResponse<User>>('/auth/profile', { displayName, email })
      if (response.data.success && response.data.data) {
        await tokenStorage.setItem('user', JSON.stringify(response.data.data))
        return response.data.data
      }
      throw new Error(response.data.error || '更新资料失败')
    },
  }
}
