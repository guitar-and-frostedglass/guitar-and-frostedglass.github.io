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

  async updateProfile(displayName: string, email: string): Promise<AuthResponse['user']> {
    const response = await api.put<ApiResponse<AuthResponse['user']>>('/auth/profile', { displayName, email })
    if (response.data.success && response.data.data) {
      sessionStorage.setItem('user', JSON.stringify(response.data.data))
      return response.data.data
    }
    throw new Error(response.data.error || '更新资料失败')
  },

  async hasSecondaryPin(): Promise<boolean> {
    const response = await api.get<ApiResponse<{ hasPin: boolean }>>('/auth/has-secondary-pin')
    if (response.data.success && response.data.data) {
      return response.data.data.hasPin
    }
    return false
  },

  async setSecondaryPin(pin: string, currentPin?: string): Promise<void> {
    const response = await api.put<ApiResponse<null>>('/auth/secondary-pin', { pin, currentPin })
    if (!response.data.success) {
      throw new Error(response.data.error || '设置二级密码失败')
    }
  },

  async verifySecondaryPin(pin: string): Promise<boolean> {
    const response = await api.post<ApiResponse<null>>('/auth/verify-secondary-pin', { pin })
    return response.data.success === true
  },
}
