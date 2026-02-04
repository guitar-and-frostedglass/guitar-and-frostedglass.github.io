import { useState } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import type { NoteColor } from '../../../../shared/types'
import { NOTE_COLORS } from '../../../../shared/types'

const colorClasses: Record<NoteColor, string> = {
  yellow: 'bg-amber-100',
  pink: 'bg-pink-100',
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  purple: 'bg-purple-100',
  orange: 'bg-orange-100',
}

export default function AddNoteButton() {
  const { createNote, notes } = useNoteStore()
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateNote = async (color: NoteColor = 'yellow') => {
    if (isCreating) return
    
    setIsCreating(true)
    setShowColorPicker(false)

    // 计算新便签位置（避免重叠）
    const baseX = 50 + (notes.length % 5) * 30
    const baseY = 50 + Math.floor(notes.length / 5) * 30 + (notes.length % 3) * 20

    try {
      await createNote({
        content: '',
        color,
        positionX: baseX,
        positionY: baseY,
      })
    } catch (error) {
      console.error('Failed to create note:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-20">
      {/* Color Picker Popup */}
      {showColorPicker && (
        <>
          <div 
            className="fixed inset-0" 
            onClick={() => setShowColorPicker(false)} 
          />
          <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-lg p-3 mb-2">
            <p className="text-xs text-gray-500 mb-2">选择便签颜色</p>
            <div className="flex gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleCreateNote(c.value)}
                  className={`w-8 h-8 rounded-lg ${colorClasses[c.value]} 
                    border-2 border-transparent hover:border-gray-300
                    hover:scale-110 transition-all shadow-sm`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Main Button */}
      <button
        onClick={() => setShowColorPicker(!showColorPicker)}
        disabled={isCreating}
        className={`w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 
          text-white shadow-lg hover:shadow-xl hover:scale-105 
          focus:ring-4 focus:ring-primary-200
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 flex items-center justify-center
          ${showColorPicker ? 'rotate-45' : ''}`}
      >
        {isCreating ? (
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" cy="12" r="10" 
              stroke="currentColor" 
              strokeWidth="4"
              fill="none"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>
    </div>
  )
}

