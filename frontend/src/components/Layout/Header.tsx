import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useNoteStore } from '../../stores/noteStore'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { clearNotes } = useNoteStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const isAdmin = user?.role === 'ADMIN'

  const handleLogout = () => {
    clearNotes()
    logout()
    navigate('/login')
  }

  return (
    <header className="glass border-b border-white/20 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎸</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Guitar & Frosted Glass
            </h1>
            <p className="text-xs text-gray-500">共享日记</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/50 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium">
              {user?.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user?.displayName || '用户'}
            </span>
            {isAdmin && (
              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full hidden sm:inline">
                管理员
              </span>
            )}
            <svg 
              className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-lg border border-white/20 py-2 z-20">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">{user?.displayName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => { navigate('/admin'); setShowDropdown(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    管理后台
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
