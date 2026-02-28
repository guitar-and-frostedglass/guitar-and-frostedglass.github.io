import { useState, useRef, useEffect, useCallback } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import { useAuthStore } from '../../stores/authStore'
import type { NoteColor, Reply } from '../../../../shared/types'
import UserAvatar from '../UserAvatar'

const colorAccent: Record<NoteColor, string> = {
  yellow: 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800/50',
  pink: 'bg-pink-100 dark:bg-pink-900/40 border-pink-200 dark:border-pink-800/50',
  blue: 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800/50',
  green: 'bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800/50',
  purple: 'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800/50',
  orange: 'bg-orange-100 dark:bg-orange-900/40 border-orange-200 dark:border-orange-800/50',
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
  const { activeNote, setActiveNote, createReply, deleteReply, updateReply, updateNote, publishNote, fetchNote, markNoteRead } = useNoteStore()
  const { user } = useAuthStore()
  const [replyContent, setReplyContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isAdmin = user?.role === 'ADMIN'

  const [editingNoteContent, setEditingNoteContent] = useState<string | null>(null)
  const [editingNoteTitle, setEditingNoteTitle] = useState<string | null>(null)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [editingReplyContent, setEditingReplyContent] = useState('')
  const [isSavingReply, setIsSavingReply] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Reply | null>(null)

  useEffect(() => {
    if (activeNote?.id) {
      fetchNote(activeNote.id)
      markNoteRead(activeNote.id)
    }
  }, [activeNote?.id, fetchNote, markNoteRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeNote?.replies])

  if (!activeNote) return null

  const color = activeNote.color as NoteColor
  const isNoteOwner = user?.id === activeNote.userId
  const isDraft = activeNote.status === 'DRAFT'
  const isEditingNote = editingNoteContent !== null

  const handleSendReply = async () => {
    if (!replyContent.trim() || isSending) return
    setIsSending(true)
    try {
      await createReply(activeNote.id, replyContent.trim(), replyingTo?.id)
      setReplyContent('')
      setReplyingTo(null)
      textareaRef.current?.focus()
    } catch {
      // error handled in store
    } finally {
      setIsSending(false)
    }
  }

  const handleReplyTo = useCallback((reply: Reply) => {
    setReplyingTo(reply)
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  const handleStartEditNote = () => {
    setEditingNoteContent(activeNote.content)
    setEditingNoteTitle(activeNote.title)
  }

  const handleCancelEditNote = () => {
    setEditingNoteContent(null)
    setEditingNoteTitle(null)
  }

  const handleSaveNote = async () => {
    if (isSavingNote) return
    const newTitle = editingNoteTitle?.trim() ?? activeNote.title
    const newContent = editingNoteContent?.trim() ?? activeNote.content
    if (!newContent) return

    if (newTitle === activeNote.title && newContent === activeNote.content) {
      handleCancelEditNote()
      return
    }

    setIsSavingNote(true)
    try {
      await updateNote(activeNote.id, { title: newTitle, content: newContent })
      handleCancelEditNote()
    } catch {
      // error handled in store
    } finally {
      setIsSavingNote(false)
    }
  }

  const handlePublish = async () => {
    if (isPublishing) return
    setIsPublishing(true)
    try {
      await publishNote(activeNote.id)
    } catch {
      // error handled in store
    } finally {
      setIsPublishing(false)
    }
  }

  const handleStartEditReply = (replyId: string, content: string) => {
    setEditingReplyId(replyId)
    setEditingReplyContent(content)
  }

  const handleCancelEditReply = () => {
    setEditingReplyId(null)
    setEditingReplyContent('')
  }

  const handleSaveReply = async () => {
    if (isSavingReply || !editingReplyId) return
    const newContent = editingReplyContent.trim()
    if (!newContent) return

    const originalReply = activeNote.replies?.find((r) => r.id === editingReplyId)
    if (originalReply && newContent === originalReply.content) {
      handleCancelEditReply()
      return
    }

    setIsSavingReply(true)
    try {
      await updateReply(activeNote.id, editingReplyId, newContent)
      handleCancelEditReply()
    } catch {
      // error handled in store
    } finally {
      setIsSavingReply(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className={`flex items-center justify-between px-5 py-4 border-b rounded-t-2xl ${colorAccent[color]}`}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
                {activeNote.title || '无标题'}
              </h2>
              {isDraft && (
                <span className="px-2 py-0.5 bg-gray-600 text-white text-xs font-medium rounded-full flex-shrink-0">
                  草稿
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{activeNote.user?.displayName}</span>
              <span>·</span>
              <span>{new Date(activeNote.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            {isDraft && isNoteOwner && (
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-primary-500 to-primary-600 
                  text-white rounded-lg hover:from-primary-600 hover:to-primary-700 
                  disabled:opacity-50 transition-all font-medium"
              >
                {isPublishing ? '发布中...' : '发布'}
              </button>
            )}
            <button
              onClick={() => setActiveNote(null)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Note content */}
          <div className="flex gap-3">
            <UserAvatar
              displayName={activeNote.user?.displayName}
              avatar={activeNote.user?.avatar}
              size={32}
              gradient={avatarGradient[color]}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {activeNote.user?.displayName}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(activeNote.createdAt).toLocaleString('zh-CN')}
                </span>
                {isNoteOwner && !isEditingNote && (
                  <button
                    onClick={handleStartEditNote}
                    className="ml-auto p-1 hover:bg-black/5 rounded transition-colors flex-shrink-0"
                    title="编辑"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
              {isEditingNote ? (
                <div className={`rounded-xl px-4 py-3 ${colorAccent[color]} space-y-2`}>
                  <input
                    type="text"
                    value={editingNoteTitle ?? ''}
                    onChange={(e) => setEditingNoteTitle(e.target.value)}
                    placeholder="标题（可选）"
                    maxLength={100}
                    className="w-full px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg text-sm
                      focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/50 transition-all bg-white dark:bg-white/5 dark:text-gray-200"
                  />
                  <textarea
                    value={editingNoteContent ?? ''}
                    onChange={(e) => setEditingNoteContent(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg resize-none text-sm
                      focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/50 transition-all bg-white dark:bg-white/5 dark:text-gray-200"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelEditNote}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveNote}
                      disabled={isSavingNote || !editingNoteContent?.trim()}
                      className="px-3 py-1 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600 
                        disabled:opacity-50 transition-colors"
                    >
                      {isSavingNote ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`rounded-xl px-4 py-3 ${colorAccent[color]}`}>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{activeNote.content}</p>
                </div>
              )}
            </div>
          </div>

          {/* Replies */}
          {activeNote.replies?.map((reply) => {
            const isMe = reply.userId === user?.id
            const canDelete = isMe || isAdmin
            const isEditingThis = editingReplyId === reply.id
            return (
              <div key={reply.id} className="group flex gap-3">
                <UserAvatar
                  displayName={reply.user?.displayName}
                  avatar={reply.user?.avatar}
                  size={32}
                  gradient={isMe ? 'from-primary-400 to-primary-500' : 'from-gray-300 to-gray-400'}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {reply.user?.displayName}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {new Date(reply.createdAt).toLocaleString('zh-CN')}
                    </span>
                    {!isEditingThis && (
                      <span className="ml-auto flex items-center gap-1 flex-shrink-0">
                        {!isDraft && confirmDeleteId !== reply.id && (
                          <button
                            onClick={() => handleReplyTo(reply)}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-black/5 rounded transition-all"
                            title="引用回复"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-300 sm:text-gray-400 hover:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 10h10a5 5 0 015 5v6M3 10l6 6M3 10l6-6" />
                            </svg>
                          </button>
                        )}
                        {isMe && confirmDeleteId !== reply.id && (
                          <button
                            onClick={() => handleStartEditReply(reply.id, reply.content)}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-black/5 rounded transition-all"
                            title="编辑回复"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-300 sm:text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {canDelete && confirmDeleteId !== reply.id && (
                          <button
                            onClick={() => setConfirmDeleteId(reply.id)}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                            title="删除回复"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-300 sm:text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        {confirmDeleteId === reply.id && (
                          <>
                            <button
                              onClick={async () => {
                                setDeletingReplyId(reply.id)
                                try {
                                  await deleteReply(activeNote.id, reply.id)
                                } catch { /* handled in store */ }
                                setDeletingReplyId(null)
                                setConfirmDeleteId(null)
                              }}
                              disabled={deletingReplyId === reply.id}
                              className="text-xs leading-none px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              {deletingReplyId === reply.id ? '...' : '删除'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs leading-none px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                            >
                              取消
                            </button>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  {isEditingThis ? (
                    <div className={`rounded-xl px-4 py-3 ${isMe ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800/40' : 'bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10'} space-y-2`}>
                      <textarea
                        value={editingReplyContent}
                        onChange={(e) => setEditingReplyContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg resize-none text-sm
                          focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/50 transition-all bg-white dark:bg-white/5 dark:text-gray-200"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelEditReply}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleSaveReply}
                          disabled={isSavingReply || !editingReplyContent.trim()}
                          className="px-3 py-1 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600 
                            disabled:opacity-50 transition-colors"
                        >
                          {isSavingReply ? '保存中...' : '保存'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`rounded-xl px-4 py-3 ${isMe ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800/40' : 'bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10'}`}>
                      {reply.replyTo && (
                        <div className="mb-2 pl-3 border-l-2 border-gray-300 rounded-sm">
                          <p className="text-xs font-medium text-gray-500">
                            {reply.replyTo.user?.displayName}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-2 whitespace-pre-wrap break-words">
                            {reply.replyTo.content}
                          </p>
                        </div>
                      )}
                      {reply.replyToId && !reply.replyTo && (
                        <div className="mb-2 pl-3 border-l-2 border-gray-200 rounded-sm">
                          <p className="text-xs text-gray-400 italic">该回复已被删除</p>
                        </div>
                      )}
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{reply.content}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>

        {!isDraft && (
          <div className="border-t dark:border-white/10 px-5 py-3">
            {replyingTo && (
              <div className="flex items-start gap-2 mb-2 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-primary-600">
                    回复 {replyingTo.user?.displayName}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-wrap break-words">
                    {replyingTo.content}
                  </p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={replyingTo ? `回复 ${replyingTo.user?.displayName}...` : '输入回复... (Enter 发送, Shift+Enter 换行)'}
                rows={1}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl resize-none
                  focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/50
                  transition-all duration-200 bg-gray-50 dark:bg-white/5 dark:text-gray-200 text-sm"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyContent.trim() || isSending}
                className="px-3 sm:px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 
                  text-white rounded-xl hover:from-primary-600 hover:to-primary-700 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 
                  flex items-center gap-1 text-sm font-medium flex-shrink-0 whitespace-nowrap"
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
        )}
      </div>
    </div>
  )
}
