import { create } from 'zustand'
import { noteService } from '../services/noteService'
import type { Note, Reply, CreateNoteRequest, UpdateNoteRequest } from '../../../shared/types'

const READ_COUNTS_KEY = 'gfg_read_counts'

function loadReadCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(READ_COUNTS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveReadCounts(counts: Record<string, number>) {
  localStorage.setItem(READ_COUNTS_KEY, JSON.stringify(counts))
}

interface NoteState {
  notes: Note[]
  activeNote: Note | null
  isLoading: boolean
  error: string | null
  readCounts: Record<string, number>

  fetchNotes: () => Promise<void>
  fetchNote: (id: string) => Promise<void>
  createNote: (data: CreateNoteRequest) => Promise<Note>
  updateNote: (id: string, data: UpdateNoteRequest) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  createReply: (noteId: string, content: string) => Promise<Reply>
  deleteReply: (noteId: string, replyId: string) => Promise<void>
  setActiveNote: (note: Note | null) => void
  markNoteRead: (noteId: string) => void
  isNoteUnread: (noteId: string) => boolean
  clearError: () => void
  clearNotes: () => void
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  activeNote: null,
  isLoading: false,
  error: null,
  readCounts: loadReadCounts(),

  fetchNotes: async () => {
    set({ isLoading: true, error: null })
    try {
      const notes = await noteService.getNotes()
      const stored = get().readCounts
      const updated = { ...stored }
      let changed = false
      for (const note of notes) {
        const count = note._count?.replies ?? 0
        if (!(note.id in updated)) {
          updated[note.id] = count
          changed = true
        }
      }
      if (changed) {
        saveReadCounts(updated)
        set({ notes, readCounts: updated, isLoading: false })
      } else {
        set({ notes, isLoading: false })
      }
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
      const updated = { ...get().readCounts, [note.id]: 0 }
      saveReadCounts(updated)
      set((state) => ({
        notes: [note, ...state.notes],
        readCounts: updated,
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
      const updated = { ...get().readCounts }
      delete updated[id]
      saveReadCounts(updated)
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
        activeNote: state.activeNote?.id === id ? null : state.activeNote,
        readCounts: updated,
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
      const newCount = (get().notes.find((n) => n.id === noteId)?._count?.replies ?? 0) + 1
      const updatedCounts = { ...get().readCounts, [noteId]: newCount }
      saveReadCounts(updatedCounts)
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === noteId
            ? { ...note, _count: { replies: newCount }, lastActivityAt: new Date().toISOString() }
            : note
        ).sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()),
        readCounts: updatedCounts,
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
      const newCount = Math.max((get().notes.find((n) => n.id === noteId)?._count?.replies ?? 1) - 1, 0)
      const updatedCounts = { ...get().readCounts, [noteId]: newCount }
      saveReadCounts(updatedCounts)
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === noteId
            ? { ...note, _count: { replies: newCount } }
            : note
        ),
        readCounts: updatedCounts,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除回复失败'
      set({ error: message })
      throw error
    }
  },

  markNoteRead: (noteId: string) => {
    const note = get().notes.find((n) => n.id === noteId)
    const count = note?._count?.replies ?? 0
    const updated = { ...get().readCounts, [noteId]: count }
    saveReadCounts(updated)
    set({ readCounts: updated })
  },

  isNoteUnread: (noteId: string) => {
    const { notes, readCounts } = get()
    const note = notes.find((n) => n.id === noteId)
    if (!note) return false
    const current = note._count?.replies ?? 0
    const seen = readCounts[noteId] ?? 0
    return current > seen
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
