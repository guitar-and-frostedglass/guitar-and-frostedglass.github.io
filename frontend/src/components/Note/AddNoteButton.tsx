import { useState } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import { useLayerStore } from '../../stores/layerStore'
import type { NoteColor } from '../../../../shared/types'
import { NOTE_COLORS } from '../../../../shared/types'

const colorClasses: Record<NoteColor, string> = {
  yellow: 'bg-amber-100 border-amber-300',
  pink: 'bg-pink-100 border-pink-300',
  blue: 'bg-blue-100 border-blue-300',
  green: 'bg-green-100 border-green-300',
  purple: 'bg-purple-100 border-purple-300',
  orange: 'bg-orange-100 border-orange-300',
}

export default function AddNoteButton() {
  const { createNote } = useNoteStore()
  const { currentLayer } = useLayerStore()
  const [showModal, setShowModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState<NoteColor>('yellow')

  const [isSavingDraft, setIsSavingDraft] = useState(false)

  const handleCreate = async (isDraft = false) => {
    if (isCreating || isSavingDraft || !content.trim()) return
    if (isDraft) setIsSavingDraft(true)
    else setIsCreating(true)
    try {
      await createNote({ title: title.trim(), content: content.trim(), color, isDraft, layer: currentLayer })
      setShowModal(false)
      setTitle('')
      setContent('')
      setColor('yellow')
    } catch (error) {
      console.error('Failed to create note:', error)
    } finally {
      setIsCreating(false)
      setIsSavingDraft(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-20 w-14 h-14 rounded-full 
          bg-gradient-to-br from-primary-500 to-primary-600 
          text-white shadow-lg hover:shadow-xl hover:scale-105 
          focus:ring-4 focus:ring-primary-200
          transition-all duration-200 flex items-center justify-center"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
            <div className="px-6 py-4 border-b dark:border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">创建新话题</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="话题标题（可选）"
                  maxLength={100}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl 
                    focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/50
                    bg-white dark:bg-white/5 dark:text-gray-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">内容</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="写下你想分享的内容..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl resize-none
                    focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/50
                    bg-white dark:bg-white/5 dark:text-gray-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">颜色</label>
                <div className="flex gap-2">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all
                        ${colorClasses[c.value]}
                        ${color === c.value ? 'ring-2 ring-primary-400 scale-110' : 'hover:scale-105'}`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t dark:border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleCreate(true)}
                disabled={!content.trim() || isCreating || isSavingDraft}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300
                  rounded-xl hover:bg-gray-50 dark:hover:bg-white/10
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {isSavingDraft ? '保存中...' : '存为草稿'}
              </button>
              <button
                onClick={() => handleCreate(false)}
                disabled={!content.trim() || isCreating || isSavingDraft}
                className="px-5 py-2 text-sm bg-gradient-to-r from-primary-500 to-primary-600 
                  text-white rounded-xl hover:from-primary-600 hover:to-primary-700 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {isCreating ? '创建中...' : '发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
