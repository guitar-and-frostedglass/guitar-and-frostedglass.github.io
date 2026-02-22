export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange'
export type NoteStatus = 'DRAFT' | 'PUBLISHED'

export interface NoteUser {
  id: string
  displayName: string
  avatar?: string | null
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
  status: NoteStatus
  positionX: number
  positionY: number
  userId: string
  user: NoteUser
  lastActivityAt: string
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
  isDraft?: boolean
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  color?: NoteColor
}

export interface UpdateReplyRequest {
  content: string
}

export interface CreateReplyRequest {
  content: string
}

export interface DeletedReply {
  id: string
  originalReplyId: string
  content: string
  noteId: string
  noteTitle: string
  replyUserId: string
  replyUserName: string
  deletedById: string
  deletedByName: string
  replyCreatedAt: string
  deletedAt: string
}

export interface DeletedNoteReplySnapshot {
  id: string
  content: string
  userId: string
  userName: string
  createdAt: string
}

export interface DeletedNote {
  id: string
  originalNoteId: string
  title: string
  content: string
  color: string
  noteUserId: string
  noteUserName: string
  replies: DeletedNoteReplySnapshot[]
  deletedById: string
  deletedByName: string
  noteCreatedAt: string
  deletedAt: string
}

export const NOTE_COLORS: { value: NoteColor; label: string; class: string }[] = [
  { value: 'yellow', label: '黄色', class: 'bg-note-yellow' },
  { value: 'pink', label: '粉色', class: 'bg-note-pink' },
  { value: 'blue', label: '蓝色', class: 'bg-note-blue' },
  { value: 'green', label: '绿色', class: 'bg-note-green' },
  { value: 'purple', label: '紫色', class: 'bg-note-purple' },
  { value: 'orange', label: '橙色', class: 'bg-note-orange' },
]
