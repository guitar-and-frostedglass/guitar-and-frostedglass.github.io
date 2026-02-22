import { useState, useRef, useEffect } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import { useAuthStore } from '../../stores/authStore'
import type { NoteColor } from '../../../../shared/types'

const colorAccent: Record<NoteColor, string> = {
  yellow: 'bg-amber-100 border-amber-200',
  pink: 'bg-pink-100 border-pink-200',
  blue: 'bg-blue-100 border-blue-200',
  green: 'bg-green-100 border-green-200',
  purple: 'bg-purple-100 border-purple-200',
  orange: 'bg-orange-100 border-orange-200',
}

const avatarGradient: Record<NoteColor, string> = {
  yellow: 'from-amber-400 to-amber-500',
  pink: 'from-pink-400 to-pink-500',
  blue: 'from-blue-400 to-blue-500',
  green: 'from-green-400 to-green-500',
  purple: 'from-purple-400 to-purple-500',
  orange: 'from-orange-400 to-orange-500',
}

export default function NoteThread() {
  const { activeNote, setActiveNote, createReply, fetchNote } = useNoteStore()
  const { user } = useAuthStore()
  const [replyContent, setReplyContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (activeNote?.id) {
      fetchNote(activeNote.id)
    }
  }, [activeNote?.id, fetchNote])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeNote?.replies])

  if (!activeNote) return null

  const color = activeNote.color as NoteColor

  const handleSendReply = async () => {
    if (!replyContent.trim() || isSending) return
    setIsSending(true)
    try {
      await createReply(activeNote.id, replyContent.trim())
      setReplyContent('')
      textareaRef.current?.focus()
    } catch {
      // error handled in store
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b rounded-t-2xl ${colorAccent[color]}`}>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-800 truncate">
              {activeNote.title || '无标题'}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{activeNote.user?.displayName}</span>
              <span>·</span>
              <span>{new Date(activeNote.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>
          <button
            onClick={() => setActiveNote(null)}
            className="ml-3 p-2 hover:bg-black/5 rounded-full transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Original post */}
          <div className="flex gap-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient[color]} 
              flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
              {activeNote.user?.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-800">
                  {activeNote.user?.displayName}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(activeNote.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
              <div className={`rounded-xl px-4 py-3 ${colorAccent[color]}`}>
                <p className="text-gray-800 whitespace-pre-wrap break-words">{activeNote.content}</p>
              </div>
            </div>
          </div>

          {/* Replies */}
          {activeNote.replies?.map((reply) => {
            const isMe = reply.userId === user?.id
            return (
              <div key={reply.id} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br 
                  ${isMe ? 'from-primary-400 to-primary-500' : 'from-gray-300 to-gray-400'} 
                  flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {reply.user?.displayName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">
                      {reply.user?.displayName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(reply.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className={`rounded-xl px-4 py-3 ${isMe ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50 border border-gray-100'}`}>
                    <p className="text-gray-800 whitespace-pre-wrap break-words">{reply.content}</p>
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply Input */}
        <div className="border-t px-5 py-3">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入回复... (Enter 发送, Shift+Enter 换行)"
              rows={1}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl resize-none
                focus:border-primary-400 focus:ring-2 focus:ring-primary-100 
                transition-all duration-200 bg-gray-50 text-sm"
            />
            <button
              onClick={handleSendReply}
              disabled={!replyContent.trim() || isSending}
              className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 
                text-white rounded-xl hover:from-primary-600 hover:to-primary-700 
                disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 
                flex items-center gap-1 text-sm font-medium flex-shrink-0"
            >
              {isSending ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
