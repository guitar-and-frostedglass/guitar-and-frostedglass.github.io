import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useNoteStore } from '../stores/noteStore'
import Header from '../components/Layout/Header'
import NoteBoard from '../components/Note/NoteBoard'
import AddNoteButton from '../components/Note/AddNoteButton'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { fetchNotes, isLoading, error } = useNoteStore()

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 relative overflow-hidden">
        {/* Welcome Message (显示一次或加载时) */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg shadow-md">
              {error}
            </div>
          </div>
        )}

        {/* Note Board */}
        <NoteBoard />

        {/* Add Note Button */}
        <AddNoteButton />
      </main>
    </div>
  )
}

