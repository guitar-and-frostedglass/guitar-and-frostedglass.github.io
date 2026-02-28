export type UserRole = 'USER' | 'ADMIN'

export interface User {
  id: string
  email: string
  displayName: string
  avatar?: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface AdminUser extends User {
  _count?: {
    notes: number
    replies: number
  }
}

export interface LoginRequest {
  identifier: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
  inviteCode: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface SetPinRequest {
  pin: string
  currentPin?: string
}

export interface VerifyPinRequest {
  pin: string
}

export interface InviteCode {
  id: string
  code: string
  expiresAt: string
  used: boolean
  usedBy: string | null
  createdAt: string
  creator?: {
    displayName: string
  }
}
