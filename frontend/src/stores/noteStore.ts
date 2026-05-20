import { create } from 'zustand'
import { useAuthStore } from './authStore'
import { noteService } from '../services/noteService'
import { adminService } from '../services/adminService'
import { connectSocket, disconnectSocket, getSocket } from '../services/socket'
import type { Note, Reply, NoteLayer, CreateNoteRequest, UpdateNoteRequest } from '../../../shared/types'

function getUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null
}

interface NoteState {
  notes: Note[]
  activeNote: Note | null
  isLoading: boolean
  error: string | null
  readCounts: Record<string, number>

  fetchNotes: (layer?: NoteLayer) => Promise<void>
  fetchNote: (id: string) => Promise<void>
  createNote: (data: CreateNoteRequest) => Promise<Note>
  updateNote: (id: string, data: UpdateNoteRequest) => Promise<void>
  publishNote: (id: string) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  moveNoteLayer: (id: string, layer: NoteLayer) => Promise<void>
  createReply: (noteId: string, content: string, replyToId?: string) => Promise<Reply>
  updateReply: (noteId: string, replyId: string, content: string) => Promise<void>
  deleteReply: (noteId: string, replyId: string) => Promise<void>
  setActiveNote: (note: Note | null) => void
  markNoteRead: (noteId: string) => void
  isNoteUnread: (noteId: string) => boolean
  fetchReadStates: () => Promise<void>
  clearError: () => void
  clearNotes: () => void
  initSocket: () => void
  destroySocket: () => void
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  activeNote: null,
  isLoading: false,
  error: null,
  readCounts: {},

  fetchNotes: async (layer?: NoteLayer) => {
    set({ isLoading: true, error: null })
    try {
      const notes = await noteService.getNotes(layer)
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
        readCounts: { ...state.readCounts, [note.id]: 0 },
        isLoading: false,
      }))
      noteService.markNoteRead(note.id).catch((err) => console.warn('[read] markRead failed', err))
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
          note.id === id ? publishedNote : note
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
      set((state) => {
        const updated = { ...state.readCounts }
        delete updated[id]
        return {
          notes: state.notes.filter((note) => note.id !== id),
          activeNote: state.activeNote?.id === id ? null : state.activeNote,
          readCounts: updated,
        }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除便签失败'
      set({ error: message })
      throw error
    }
  },

  moveNoteLayer: async (id: string, layer: NoteLayer) => {
    try {
      await adminService.updateNoteLayer(id, layer)
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
        activeNote: state.activeNote?.id === id ? null : state.activeNote,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : '移动便签失败'
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
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === noteId
            ? { ...note, _count: { replies: newCount }, lastActivityAt: new Date().toISOString() }
            : note
        ).sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()),
        readCounts: { ...state.readCounts, [noteId]: newCount },
      }))
      noteService.markNoteRead(noteId).catch((err) => console.warn('[read] markRead failed', err))
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
              r.id === replyId ? { ...r, ...updatedReply } : r
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
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === noteId
            ? { ...note, _count: { replies: newCount } }
            : note
        ),
        readCounts: { ...state.readCounts, [noteId]: newCount },
      }))
      noteService.markNoteRead(noteId).catch((err) => console.warn('[read] markRead failed', err))
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除回复失败'
      set({ error: message })
      throw error
    }
  },

  markNoteRead: (noteId: string) => {
    const note = get().notes.find((n) => n.id === noteId)
    const count = note?._count?.replies ?? 0
    set((state) => ({ readCounts: { ...state.readCounts, [noteId]: count } }))
    noteService.markNoteRead(noteId).catch((err) => console.warn('[read] markRead failed', err))
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

  fetchReadStates: async () => {
    if (!getUserId()) return
    try {
      const map = await noteService.getReadStates()
      set({ readCounts: map })
    } catch (err) {
      console.warn('[read] fetchReadStates failed', err)
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

  initSocket: () => {
    try {
      const socket = connectSocket()
      const currentUserId = getUserId()

      socket.on('note:created', (note: Note) => {
        if (note.userId === currentUserId) return
        set((state) => {
          const exists = state.notes.some((n) => n.id === note.id)
          if (exists) return state
          return {
            notes: [note, ...state.notes].sort(
              (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
            ),
          }
        })
      })

      socket.on('note:updated', (note: Note) => {
        if (note.userId === currentUserId) return
        set((state) => ({
          notes: state.notes.map((n) => (n.id === note.id ? { ...n, ...note } : n)),
          activeNote:
            state.activeNote?.id === note.id
              ? { ...state.activeNote, ...note, replies: state.activeNote.replies }
              : state.activeNote,
        }))
      })

      socket.on('note:deleted', ({ id }: { id: string }) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          activeNote: state.activeNote?.id === id ? null : state.activeNote,
        }))
      })

      socket.on('reply:created', ({ noteId, reply }: { noteId: string; reply: Reply }) => {
        if (reply.userId === currentUserId) return
        set((state) => {
          const newNotes = state.notes.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  _count: { replies: (n._count?.replies ?? 0) + 1 },
                  lastActivityAt: new Date().toISOString(),
                }
              : n
          ).sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())

          const newActiveNote =
            state.activeNote?.id === noteId && state.activeNote.replies
              ? {
                  ...state.activeNote,
                  replies: state.activeNote.replies.some((r) => r.id === reply.id)
                    ? state.activeNote.replies
                    : [...state.activeNote.replies, reply],
                }
              : state.activeNote

          return { notes: newNotes, activeNote: newActiveNote }
        })
      })

      socket.on('reply:updated', ({ noteId, reply }: { noteId: string; reply: Reply }) => {
        if (reply.userId === currentUserId) return
        set((state) => {
          if (state.activeNote?.id !== noteId || !state.activeNote.replies) return state
          return {
            activeNote: {
              ...state.activeNote,
              replies: state.activeNote.replies.map((r) =>
                r.id === reply.id ? { ...r, ...reply } : r
              ),
            },
          }
        })
      })

      socket.on('reply:deleted', ({ noteId, replyId }: { noteId: string; replyId: string }) => {
        set((state) => {
          const newNotes = state.notes.map((n) =>
            n.id === noteId
              ? { ...n, _count: { replies: Math.max((n._count?.replies ?? 1) - 1, 0) } }
              : n
          )

          const newActiveNote =
            state.activeNote?.id === noteId && state.activeNote.replies
              ? {
                  ...state.activeNote,
                  replies: state.activeNote.replies.filter((r) => r.id !== replyId),
                }
              : state.activeNote

          return { notes: newNotes, activeNote: newActiveNote }
        })
      })
    } catch {
      // token not available yet, socket will be retried on next call
    }
  },

  destroySocket: () => {
    const socket = getSocket()
    if (socket) {
      socket.off('note:created')
      socket.off('note:updated')
      socket.off('note:deleted')
      socket.off('reply:created')
      socket.off('reply:updated')
      socket.off('reply:deleted')
    }
    disconnectSocket()
  },
}))
