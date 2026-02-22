export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange'

export interface NoteUser {
  id: string
  displayName: string
}

export interface Reply {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  noteId: string
  userId: string
  user: NoteUser
}

export interface Note {
  id: string
  title: string
  content: string
  color: NoteColor
  positionX: number
  positionY: number
  userId: string
  user: NoteUser
  createdAt: string
  updatedAt: string
  _count?: {
    replies: number
  }
  replies?: Reply[]
}

export interface CreateNoteRequest {
  title: string
  content: string
  color?: NoteColor
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  color?: NoteColor
}

export interface CreateReplyRequest {
  content: string
}

export const NOTE_COLORS: { value: NoteColor; label: string; class: string }[] = [
  { value: 'yellow', label: '黄色', class: 'bg-note-yellow' },
  { value: 'pink', label: '粉色', class: 'bg-note-pink' },
  { value: 'blue', label: '蓝色', class: 'bg-note-blue' },
  { value: 'green', label: '绿色', class: 'bg-note-green' },
  { value: 'purple', label: '紫色', class: 'bg-note-purple' },
  { value: 'orange', label: '橙色', class: 'bg-note-orange' },
]
