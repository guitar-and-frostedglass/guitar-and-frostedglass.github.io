import api from './api'
import type { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../../../shared/types'

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data)
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data
      sessionStorage.setItem('token', token)
      sessionStorage.setItem('user', JSON.stringify(user))
      return response.data.data
    }
    throw new Error(response.data.error || '登录失败')
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data)
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data
      sessionStorage.setItem('token', token)
      sessionStorage.setItem('user', JSON.stringify(user))
      return response.data.data
    }
    throw new Error(response.data.error || '注册失败')
  },

  logout(): void {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  },

  getCurrentUser(): AuthResponse['user'] | null {
    const userStr = sessionStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  },

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('token')
  },

  async updateAvatar(avatar: string): Promise<AuthResponse['user']> {
    const response = await api.put<ApiResponse<AuthResponse['user']>>('/auth/avatar', { avatar })
    if (response.data.success && response.data.data) {
      sessionStorage.setItem('user', JSON.stringify(response.data.data))
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
}
