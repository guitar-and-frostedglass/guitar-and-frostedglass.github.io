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
          <p className="text-sm">点击右下角的 + 按钮创建第一个话题</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  )
}
