import api from './api'
import type { AdminUser, InviteCode, DeletedReply, DeletedNote, ApiResponse } from '../../../shared/types'

export const adminService = {
  async getUsers(): Promise<AdminUser[]> {
    const response = await api.get<ApiResponse<AdminUser[]>>('/admin/users')
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '获取用户列表失败')
  },

  async deleteUser(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/admin/users/${id}`)
    if (!response.data.success) {
      throw new Error(response.data.error || '删除用户失败')
    }
  },

  async updateUserRole(id: string, role: string): Promise<AdminUser> {
    const response = await api.put<ApiResponse<AdminUser>>(`/admin/users/${id}/role`, { role })
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '更新角色失败')
  },

  async generateInviteCode(email?: string): Promise<InviteCode & { emailSent?: boolean }> {
    const response = await api.post<ApiResponse<InviteCode & { emailSent?: boolean }>>(
      '/admin/invite-codes',
      email ? { email } : {}
    )
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '生成邀请码失败')
  },

  async getInviteCodes(): Promise<InviteCode[]> {
    const response = await api.get<ApiResponse<InviteCode[]>>('/admin/invite-codes')
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '获取邀请码列表失败')
  },

  async getDeletedReplies(): Promise<DeletedReply[]> {
    const response = await api.get<ApiResponse<DeletedReply[]>>('/admin/deleted-replies')
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '获取删除记录失败')
  },

  async getDeletedNotes(): Promise<DeletedNote[]> {
    const response = await api.get<ApiResponse<DeletedNote[]>>('/admin/deleted-notes')
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '获取便签删除记录失败')
  },

  async restoreNote(id: string): Promise<void> {
    const response = await api.post<ApiResponse<void>>(`/admin/deleted-notes/${id}/restore`)
    if (!response.data.success) {
      throw new Error(response.data.error || '恢复便签失败')
    }
  },

  async permanentlyDeleteNote(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/admin/deleted-notes/${id}`)
    if (!response.data.success) {
      throw new Error(response.data.error || '彻底删除失败')
    }
  },
}
