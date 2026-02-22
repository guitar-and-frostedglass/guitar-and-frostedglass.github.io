import { create } from 'zustand'
import { noteService } from '../services/noteService'
import type { Note, Reply, CreateNoteRequest, UpdateNoteRequest } from '../../../shared/types'

interface NoteState {
  notes: Note[]
  activeNote: Note | null
  isLoading: boolean
  error: string | null

  fetchNotes: () => Promise<void>
  fetchNote: (id: string) => Promise<void>
  createNote: (data: CreateNoteRequest) => Promise<Note>
  updateNote: (id: string, data: UpdateNoteRequest) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  createReply: (noteId: string, content: string) => Promise<Reply>
  deleteReply: (noteId: string, replyId: string) => Promise<void>
  setActiveNote: (note: Note | null) => void
  clearError: () => void
  clearNotes: () => void
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  activeNote: null,
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null })
    try {
      const notes = await noteService.getNotes()
      set({ notes, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取便签失败'
      set({ error: message, isLoading: false })
    }
  },

  fetchNote: async (id: string) => {
    try {
      const note = await noteService.getNote(id)
      set({ activeNote: note })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取便签详情失败'
      set({ error: message })
    }
  },

  createNote: async (data: CreateNoteRequest) => {
    set({ isLoading: true, error: null })
    try {
      const note = await noteService.createNote(data)
      set((state) => ({
        notes: [note, ...state.notes],
        isLoading: false,
      }))
      return note
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建便签失败'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  updateNote: async (id: string, data: UpdateNoteRequest) => {
    try {
      const updatedNote = await noteService.updateNote(id, data)
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id ? updatedNote : note
        ),
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新便签失败'
      set({ error: message })
      throw error
    }
  },

  deleteNote: async (id: string) => {
    try {
      await noteService.deleteNote(id)
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
        activeNote: state.activeNote?.id === id ? null : state.activeNote,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除便签失败'
      set({ error: message })
      throw error
    }
  },

  createReply: async (noteId: string, content: string) => {
    try {
      const reply = await noteService.createReply(noteId, { content })
      const { activeNote } = get()
      if (activeNote && activeNote.id === noteId && activeNote.replies) {
        set({
          activeNote: {
            ...activeNote,
            replies: [...activeNote.replies, reply],
          },
        })
      }
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === noteId
            ? { ...note, _count: { replies: (note._count?.replies ?? 0) + 1 } }
            : note
        ),
      }))
      return reply
    } catch (error) {
      const message = error instanceof Error ? error.message : '回复失败'
      set({ error: message })
      throw error
    }
  },

  deleteReply: async (noteId: string, replyId: string) => {
    try {
      await noteService.deleteReply(noteId, replyId)
      const { activeNote } = get()
      if (activeNote && activeNote.id === noteId && activeNote.replies) {
        set({
          activeNote: {
            ...activeNote,
            replies: activeNote.replies.filter((r) => r.id !== replyId),
          },
        })
      }
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === noteId
            ? { ...note, _count: { replies: Math.max((note._count?.replies ?? 1) - 1, 0) } }
            : note
        ),
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除回复失败'
      set({ error: message })
      throw error
    }
  },

  setActiveNote: (note: Note | null) => {
    set({ activeNote: note })
  },

  clearError: () => {
    set({ error: null })
  },

  clearNotes: () => {
    set({ notes: [], activeNote: null, error: null })
  },
}))
