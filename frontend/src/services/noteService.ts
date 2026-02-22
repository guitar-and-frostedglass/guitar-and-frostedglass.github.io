import api from './api'
import type { Note, Reply, CreateNoteRequest, UpdateNoteRequest, CreateReplyRequest, ApiResponse } from '../../../shared/types'

export const noteService = {
  async getNotes(): Promise<Note[]> {
    const response = await api.get<ApiResponse<Note[]>>('/notes')
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '获取便签失败')
  },

  async getNote(id: string): Promise<Note> {
    const response = await api.get<ApiResponse<Note>>(`/notes/${id}`)
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '获取便签详情失败')
  },

  async createNote(data: CreateNoteRequest): Promise<Note> {
    const response = await api.post<ApiResponse<Note>>('/notes', data)
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '创建便签失败')
  },

  async updateNote(id: string, data: UpdateNoteRequest): Promise<Note> {
    const response = await api.put<ApiResponse<Note>>(`/notes/${id}`, data)
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '更新便签失败')
  },

  async deleteNote(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/notes/${id}`)
    if (!response.data.success) {
      throw new Error(response.data.error || '删除便签失败')
    }
  },

  async createReply(noteId: string, data: CreateReplyRequest): Promise<Reply> {
    const response = await api.post<ApiResponse<Reply>>(`/notes/${noteId}/replies`, data)
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || '回复失败')
  },

  async deleteReply(noteId: string, replyId: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/notes/${noteId}/replies/${replyId}`)
    if (!response.data.success) {
      throw new Error(response.data.error || '删除回复失败')
    }
  },
}
