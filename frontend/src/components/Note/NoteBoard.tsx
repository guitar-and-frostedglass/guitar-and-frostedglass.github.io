import { useNoteStore } from '../../stores/noteStore'
import NoteCard from './NoteCard'

export default function NoteBoard() {
  const { notes } = useNoteStore()

  if (notes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg">还没有便签</p>
          <p className="text-sm">点击右下角的 + 按钮创建第一个便签</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full relative p-4" style={{ minHeight: 'calc(100vh - 80px)' }}>
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  )
}

