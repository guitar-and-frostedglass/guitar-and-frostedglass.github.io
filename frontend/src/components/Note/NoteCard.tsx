import { useNoteStore } from '../../stores/noteStore'
import { useAuthStore } from '../../stores/authStore'
import type { Note, NoteColor } from '../../../../shared/types'
import { useState } from 'react'
import UserAvatar from '../UserAvatar'

interface NoteCardProps {
  note: Note
}

const colorClasses: Record<NoteColor, string> = {
  yellow: 'bg-amber-50 border-amber-200 hover:border-amber-300',
  pink: 'bg-pink-50 border-pink-200 hover:border-pink-300',
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-300',
  green: 'bg-green-50 border-green-200 hover:border-green-300',
  purple: 'bg-purple-50 border-purple-200 hover:border-purple-300',
  orange: 'bg-orange-50 border-orange-200 hover:border-orange-300',
}

const avatarColors: Record<NoteColor, string> = {
  yellow: 'from-amber-400 to-amber-500',
  pink: 'from-pink-400 to-pink-500',
  blue: 'from-blue-400 to-blue-500',
  green: 'from-green-400 to-green-500',
  purple: 'from-purple-400 to-purple-500',
  orange: 'from-orange-400 to-orange-500',
}

export default function NoteCard({ note }: NoteCardProps) {
  const { setActiveNote, fetchNote, deleteNote } = useNoteStore()
  const { user } = useAuthStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isOwner = user?.id === note.userId

  const handleClick = async () => {
    await fetchNote(note.id)
    setActiveNote(note)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteNote(note.id)
    setShowDeleteConfirm(false)
  }

  const replyCount = note._count?.replies ?? 0
  const timeAgo = getRelativeTime(note.createdAt)

  return (
    <div
      onClick={handleClick}
      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 
        hover:shadow-md hover:-translate-y-0.5 note-appear ${colorClasses[note.color]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <UserAvatar
            displayName={note.user?.displayName}
            avatar={note.user?.avatar}
            size={28}
            gradient={avatarColors[note.color]}
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600 truncate">
              {note.user?.displayName || '匿名'}
            </p>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true) }}
            className="p-1 hover:bg-black/5 rounded transition-colors flex-shrink-0"
            title="删除"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {note.title && (
        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{note.title}</h3>
      )}

      <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
        {note.content || '...'}
      </p>

      <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>{replyCount} 条回复</span>
      </div>

      {showDeleteConfirm && (
        <div
          className="absolute inset-0 bg-white/95 rounded-xl flex items-center justify-center z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center p-4">
            <p className="text-sm text-gray-700 mb-3">确定删除这个便签吗？</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false) }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
