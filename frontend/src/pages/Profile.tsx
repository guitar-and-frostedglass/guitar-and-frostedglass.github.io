import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/authService'
import UserAvatar from '../components/UserAvatar'
import AvatarUpload from '../components/AvatarUpload'

export default function Profile() {
  const navigate = useNavigate()
  const { user, updateAvatar, updateProfile } = useAuthStore()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const hasProfileChanges = displayName !== user?.displayName || email !== user?.email

  const handleAvatarSave = async (dataUrl: string) => {
    await updateAvatar(dataUrl)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(false)

    if (displayName.trim().length === 0) {
      setProfileError('昵称不能为空')
      return
    }
    if (displayName.trim().length > 50) {
      setProfileError('昵称长度不能超过50个字符')
      return
    }

    setProfileLoading(true)
    try {
      await updateProfile(displayName.trim(), email)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : '更新资料失败')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('新密码长度至少为6位')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('两次输入的新密码不一致')
      return
    }

    setPasswordLoading(true)
    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordSuccess(true)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : '修改密码失败')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/20 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">个人资料</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-6">
        {/* Avatar Section */}
        <div className="glass rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setShowAvatarModal(true)}
              className="relative group"
            >
              <UserAvatar displayName={user?.displayName} avatar={user?.avatar} size={96} />
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 
                flex items-center justify-center transition-all">
                <svg
                  className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </button>
            <p className="text-sm text-gray-500">点击头像更换</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="glass rounded-2xl p-6 shadow-lg">
          <h2 className="text-base font-semibold text-gray-800 mb-4">基本信息</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setProfileError(null); setProfileSuccess(false) }}
                required
                maxLength={50}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                  focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all bg-white/50"
              />
              <p className="mt-1 text-xs text-gray-400">昵称是唯一的，也可以用于登录</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setProfileError(null); setProfileSuccess(false) }}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                  focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all bg-white/50"
              />
              {email !== user?.email && (
                <p className="mt-1 text-xs text-amber-600">修改邮箱后需要使用新邮箱登录</p>
              )}
            </div>

            {profileError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{profileError}</p>
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">资料已更新</p>
              </div>
            )}

            <button
              type="submit"
              disabled={profileLoading || !hasProfileChanges}
              className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 
                text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {profileLoading ? '保存中...' : '保存修改'}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="glass rounded-2xl p-6 shadow-lg">
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="text-base font-semibold text-gray-800">修改密码</h2>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPasswordSection && (
            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => { setPasswordForm(f => ({ ...f, currentPassword: e.target.value })); setPasswordError(null) }}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                    focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all bg-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => { setPasswordForm(f => ({ ...f, newPassword: e.target.value })); setPasswordError(null) }}
                  required
                  placeholder="至少6位字符"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                    focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all bg-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => { setPasswordForm(f => ({ ...f, confirmPassword: e.target.value })); setPasswordError(null) }}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                    focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all bg-white/50"
                />
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">密码修改成功</p>
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 
                  text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {passwordLoading ? '修改中...' : '确认修改'}
              </button>
            </form>
          )}
        </div>
      </main>

      {showAvatarModal && (
        <AvatarUpload onClose={() => setShowAvatarModal(false)} onSave={handleAvatarSave} />
      )}
    </div>
  )
}
