import type { Note, Reply, CreateNoteRequest, UpdateNoteRequest } from '../types'
import type { NoteService } from '../services/noteService'
import type { StorageAdapter } from '../adapters'

const READ_COUNTS_PREFIX = 'gfg_read_counts_'

async function loadReadCounts(
  persistStorage: StorageAdapter,
  userId: string | null,
): Promise<Record<string, number>> {
  if (!userId) return {}
  const key = `${READ_COUNTS_PREFIX}${userId}`
  try {
    const raw = await persistStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveReadCounts(
  persistStorage: StorageAdapter,
  userId: string | null,
  counts: Record<string, number>,
) {
  if (!userId) return
  const key = `${READ_COUNTS_PREFIX}${userId}`
  persistStorage.setItem(key, JSON.stringify(counts))
}

export interface NoteState {
  notes: Note[]
  activeNote: Note | null
  isLoading: boolean
  error: string | null
  readCounts: Record<string, number>

  fetchNotes: () => Promise<void>
  fetchNote: (id: string) => Promise<void>
  createNote: (data: CreateNoteRequest) => Promise<Note>
  updateNote: (id: string, data: UpdateNoteRequest) => Promise<void>
  publishNote: (id: string) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  createReply: (noteId: string, content: string, replyToId?: string) => Promise<Reply>
  updateReply: (noteId: string, replyId: string, content: string) => Promise<void>
  deleteReply: (noteId: string, replyId: string) => Promise<void>
  setActiveNote: (note: Note | null) => void
  markNoteRead: (noteId: string) => void
  isNoteUnread: (noteId: string) => boolean
  reloadReadCounts: () => Promise<void>
  clearError: () => void
  clearNotes: () => void
}

export function createNoteStoreSlice(
  noteService: NoteService,
  getUserId: () => string | null,
  persistStorage: StorageAdapter,
): (
  set: (partial: Partial<NoteState> | ((state: NoteState) => Partial<NoteState>)) => void,
  get: () => NoteState,
) => NoteState {
  return (set, get) => ({
    notes: [],
    activeNote: null,
    isLoading: false,
    error: null,
    readCounts: {},

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
        const updated = { ...get().readCounts, [note.id]: 0 }
        saveReadCounts(persistStorage, getUserId(), updated)
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
            note.id === id ? updatedNote : note,
          ),
          activeNote: state.activeNote?.id === id
            ? { ...state.activeNote, ...updatedNote, replies: state.activeNote.replies }
            : state.activeNote,
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新便签失败'
        set({ error: message })
        throw error
      }
    },

    publishNote: async (id: string) => {
      try {
        const publishedNote = await noteService.publishNote(id)
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? publishedNote : note,
          ).sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()),
          activeNote: state.activeNote?.id === id
            ? { ...state.activeNote, ...publishedNote, replies: state.activeNote.replies }
            : state.activeNote,
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : '发布便签失败'
        set({ error: message })
        throw error
      }
    },

    deleteNote: async (id: string) => {
      try {
        await noteService.deleteNote(id)
        const updated = { ...get().readCounts }
        delete updated[id]
        saveReadCounts(persistStorage, getUserId(), updated)
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

    createReply: async (noteId: string, content: string, replyToId?: string) => {
      try {
        const reply = await noteService.createReply(noteId, { content, ...(replyToId && { replyToId }) })
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
        saveReadCounts(persistStorage, getUserId(), updatedCounts)
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === noteId
              ? { ...note, _count: { replies: newCount }, lastActivityAt: new Date().toISOString() }
              : note,
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

    updateReply: async (noteId: string, replyId: string, content: string) => {
      try {
        const updatedReply = await noteService.updateReply(noteId, replyId, { content })
        const { activeNote } = get()
        if (activeNote && activeNote.id === noteId && activeNote.replies) {
          set({
            activeNote: {
              ...activeNote,
              replies: activeNote.replies.map((r) =>
                r.id === replyId ? { ...r, ...updatedReply } : r,
              ),
            },
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '编辑回复失败'
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
        saveReadCounts(persistStorage, getUserId(), updatedCounts)
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === noteId
              ? { ...note, _count: { replies: newCount } }
              : note,
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
      saveReadCounts(persistStorage, getUserId(), updated)
      set({ readCounts: updated })
    },

    isNoteUnread: (noteId: string) => {
      const { notes, readCounts } = get()
      const note = notes.find((n) => n.id === noteId)
      if (!note) return false
      const current = note._count?.replies ?? 0
      if (current === 0) return false
      const seen = readCounts[noteId]
      if (seen === undefined) return true
      return current > seen
    },

    reloadReadCounts: async () => {
      const counts = await loadReadCounts(persistStorage, getUserId())
      set({ readCounts: counts })
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
  })
}
