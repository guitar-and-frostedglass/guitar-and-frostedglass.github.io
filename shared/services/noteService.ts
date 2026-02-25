import type { ApiClient } from './api'
import type { Note, Reply, CreateNoteRequest, UpdateNoteRequest, UpdateReplyRequest, CreateReplyRequest, ApiResponse } from '../types'

export interface NoteService {
  getNotes(): Promise<Note[]>
  getNote(id: string): Promise<Note>
  createNote(data: CreateNoteRequest): Promise<Note>
  updateNote(id: string, data: UpdateNoteRequest): Promise<Note>
  publishNote(id: string): Promise<Note>
  deleteNote(id: string): Promise<void>
  createReply(noteId: string, data: CreateReplyRequest): Promise<Reply>
  updateReply(noteId: string, replyId: string, data: UpdateReplyRequest): Promise<Reply>
  deleteReply(noteId: string, replyId: string): Promise<void>
}

export function createNoteService(api: ApiClient): NoteService {
  return {
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

    async publishNote(id: string): Promise<Note> {
      const response = await api.put<ApiResponse<Note>>(`/notes/${id}/publish`)
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.error || '发布便签失败')
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

    async updateReply(noteId: string, replyId: string, data: UpdateReplyRequest): Promise<Reply> {
      const response = await api.put<ApiResponse<Reply>>(`/notes/${noteId}/replies/${replyId}`, data)
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.error || '编辑回复失败')
    },

    async deleteReply(noteId: string, replyId: string): Promise<void> {
      const response = await api.delete<ApiResponse<void>>(`/notes/${noteId}/replies/${replyId}`)
      if (!response.data.success) {
        throw new Error(response.data.error || '删除回复失败')
      }
    },
  }
}
