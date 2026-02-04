import api from './api'
import type { Note, CreateNoteRequest, UpdateNoteRequest, ApiResponse } from '../../../shared/types'

export const noteService = {
  // 获取所有便签
  async getNotes(): Promise<Note[]> {
    const response = await api.get<ApiResponse<Note[]>>('/notes')
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '获取便签失败')
  },

  // 创建便签
  async createNote(data: CreateNoteRequest): Promise<Note> {
    const response = await api.post<ApiResponse<Note>>('/notes', data)
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '创建便签失败')
  },

  // 更新便签
  async updateNote(id: string, data: UpdateNoteRequest): Promise<Note> {
    const response = await api.put<ApiResponse<Note>>(`/notes/${id}`, data)
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '更新便签失败')
  },

  // 删除便签
  async deleteNote(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/notes/${id}`)
    if (!response.data.success) {
      throw new Error(response.data.error || '删除便签失败')
    }
  },
}

