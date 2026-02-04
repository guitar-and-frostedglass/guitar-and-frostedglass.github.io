import { create } from 'zustand'
import { noteService } from '../services/noteService'
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '../../../shared/types'

interface NoteState {
  notes: Note[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchNotes: () => Promise<void>
  createNote: (data: CreateNoteRequest) => Promise<Note>
  updateNote: (id: string, data: UpdateNoteRequest) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  clearError: () => void
  clearNotes: () => void
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
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

  createNote: async (data: CreateNoteRequest) => {
    set({ isLoading: true, error: null })
    try {
      const note = await noteService.createNote(data)
      set((state) => ({ 
        notes: [...state.notes, note], 
        isLoading: false 
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
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除便签失败'
      set({ error: message })
      throw error
    }
  },

  clearError: () => {
    set({ error: null })
  },

  clearNotes: () => {
    set({ notes: [], error: null })
  },
}))

