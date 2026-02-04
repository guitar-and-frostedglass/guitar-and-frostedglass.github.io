import { useState, useRef, useEffect } from 'react'
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable'
import { useNoteStore } from '../../stores/noteStore'
import type { Note, NoteColor } from '../../../../shared/types'
import { NOTE_COLORS } from '../../../../shared/types'

interface NoteCardProps {
  note: Note
}

const colorClasses: Record<NoteColor, string> = {
  yellow: 'bg-amber-100',
  pink: 'bg-pink-100',
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  purple: 'bg-purple-100',
  orange: 'bg-orange-100',
}

export default function NoteCard({ note }: NoteCardProps) {
  const { updateNote, deleteNote } = useNoteStore()
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(note.content)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [isEditing])

  const handleDragStop = (_e: DraggableEvent, data: DraggableData) => {
    updateNote(note.id, {
      positionX: data.x,
      positionY: data.y,
    })
  }

  const handleContentSave = () => {
    if (content !== note.content) {
      updateNote(note.id, { content })
    }
    setIsEditing(false)
  }

  const handleColorChange = (color: NoteColor) => {
    updateNote(note.id, { color })
    setShowColorPicker(false)
  }

  const handleDelete = () => {
    deleteNote(note.id)
    setShowDeleteConfirm(false)
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x: note.positionX, y: note.positionY }}
      onStop={handleDragStop}
      handle=".drag-handle"
      bounds="parent"
    >
      <div
        ref={nodeRef}
        className={`absolute w-64 rounded-lg shadow-note hover:shadow-note-hover 
          transition-shadow duration-200 note-appear ${colorClasses[note.color]}`}
      >
        {/* Header - Drag Handle */}
        <div className="drag-handle flex items-center justify-between px-3 py-2 cursor-move border-b border-black/5">
          <div className="flex items-center gap-2">
            {/* Color Picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: colorClasses[note.color].replace('bg-', '').replace('-100', '') }}
              />
              {showColorPicker && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowColorPicker(false)} 
                  />
                  <div className="absolute top-6 left-0 bg-white rounded-lg shadow-lg p-2 flex gap-1 z-20">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => handleColorChange(c.value)}
                        className={`w-6 h-6 rounded-full ${colorClasses[c.value]} 
                          border-2 ${note.color === c.value ? 'border-gray-400' : 'border-transparent'}
                          hover:scale-110 transition-transform`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-black/10 rounded transition-colors"
              title="编辑"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="删除"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 min-h-[100px]">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleContentSave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setContent(note.content)
                  setIsEditing(false)
                }
              }}
              className="w-full h-32 bg-transparent resize-none note-text text-lg focus:outline-none"
              placeholder="写点什么..."
            />
          ) : (
            <p 
              className="note-text text-lg text-gray-800 whitespace-pre-wrap cursor-text"
              onClick={() => setIsEditing(true)}
            >
              {note.content || '点击编辑...'}
            </p>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white/90 rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-sm text-gray-700 mb-3">确定删除这个便签吗？</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
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
    </Draggable>
  )
}

