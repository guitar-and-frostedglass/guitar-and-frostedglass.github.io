import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useNoteStore } from '../../stores/noteStore'
import { useLayerStore, isNightTime } from '../../stores/layerStore'
import UserAvatar from '../UserAvatar'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { clearNotes } = useNoteStore()
  const { currentLayer, openPinModal, lock, enforceCurfew } = useLayerStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [nightMode, setNightMode] = useState(isNightTime)
  const isAdmin = user?.role === 'ADMIN'
  const isHidden = currentLayer === 'HIDDEN'

  useEffect(() => {
    const check = () => {
      setNightMode(isNightTime())
      enforceCurfew()
    }
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [enforceCurfew])

  const handleLogout = useCallback(() => {
    clearNotes()
    lock()
    logout()
    navigate('/login')
  }, [clearNotes, lock, logout, navigate])

  const handleLockToggle = useCallback(() => {
    if (isHidden) {
      lock()
    } else {
      openPinModal()
    }
  }, [isHidden, lock, openPinModal])

  return (
    <header className="glass border-b border-white/20 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎸</span>
          <div>
            <h1 className={`text-xl font-bold ${isHidden ? 'text-gray-100' : 'text-gray-800'}`}>
              Guitar & Frosted Glass
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(nightMode || isHidden) && (
            <button
              onClick={handleLockToggle}
              className={`p-2 rounded-xl transition-colors ${
                isHidden
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'hover:bg-white/50 text-gray-500'
              }`}
              title={isHidden ? '返回表便签' : '进入里便签'}
            >
              {isHidden ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </button>
          )}

          <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
              isHidden ? 'hover:bg-white/10' : 'hover:bg-white/50'
            }`}
          >
            <UserAvatar displayName={user?.displayName} avatar={user?.avatar} size={32} />
            <span className={`text-sm font-medium hidden sm:block ${isHidden ? 'text-gray-200' : 'text-gray-700'}`}>
              {user?.displayName || '用户'}
            </span>
            {isAdmin && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full hidden sm:inline">
                管理员
              </span>
            )}
            <svg 
              className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''} ${isHidden ? 'text-gray-400' : 'text-gray-500'}`}
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
                <div className="px-4 py-2 border-b border-gray-100 dark:border-white/10">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{user?.displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => { navigate('/admin'); setShowDropdown(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
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
                  onClick={() => { navigate('/profile'); setShowDropdown(false) }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  个人资料
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  退出登录
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}
