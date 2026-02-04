import api from './api'
import type { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../../../shared/types'

export const authService = {
  // 用户登录
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data)
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      return response.data.data
    }
    throw new Error(response.data.error || '登录失败')
  },

  // 用户注册
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data)
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      return response.data.data
    }
    throw new Error(response.data.error || '注册失败')
  },

  // 用户登出
  logout(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // 获取当前用户信息
  getCurrentUser(): AuthResponse['user'] | null {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  },

  // 检查是否已登录
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  },
}

