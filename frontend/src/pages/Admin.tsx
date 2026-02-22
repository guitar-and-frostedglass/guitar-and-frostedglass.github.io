import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { adminService } from '../services/adminService'
import type { AdminUser, InviteCode } from '../../../shared/types'
import UserAvatar from '../components/UserAvatar'

export default function Admin() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'users' | 'invites'>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isSending, setIsSending] = useState(false)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getUsers()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadInviteCodes = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getInviteCodes()
      setInviteCodes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'users') loadUsers()
    else loadInviteCodes()
  }, [activeTab, loadUsers, loadInviteCodes])

  const handleDeleteUser = async (id: string) => {
    if (!confirm('确定删除该用户？此操作不可撤销。')) return
    try {
      await adminService.deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      showSuccess('用户已删除')
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleToggleRole = async (targetUser: AdminUser) => {
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN'
    try {
      await adminService.updateUserRole(targetUser.id, newRole)
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      )
      showSuccess(`已将 ${targetUser.displayName} 的角色更新为 ${newRole}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    }
  }

  const handleGenerateCode = async () => {
    const emailToSend = inviteEmail.trim() || undefined
    setIsSending(true)
    try {
      const result = await adminService.generateInviteCode(emailToSend)
      setInviteCodes((prev) => [result, ...prev])
      if (emailToSend && result.emailSent) {
        showSuccess(`邀请码已生成，邮件已发送至 ${emailToSend}`)
      } else if (emailToSend && !result.emailSent) {
        showSuccess('邀请码已生成，但邮件发送失败，请手动分享')
      } else {
        showSuccess('邀请码已生成')
      }
      setInviteEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setIsSending(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showSuccess('已复制到剪贴板')
    } catch {
      showSuccess('复制失败，请手动复制')
    }
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 2000)
  }

  const getCodeStatus = (code: InviteCode) => {
    if (code.used) return { text: '已使用', cls: 'bg-gray-100 text-gray-600' }
    if (new Date(code.expiresAt) < new Date()) return { text: '已过期', cls: 'bg-red-50 text-red-600' }
    return { text: '有效', cls: 'bg-green-50 text-green-600' }
  }

  const getRemainingTime = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - Date.now()
    if (remaining <= 0) return '已过期'
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${minutes}分${seconds}秒`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Header */}
      <header className="glass border-b border-white/20 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">管理后台</h1>
              <p className="text-xs text-gray-500">欢迎，{user?.displayName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{successMsg}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all
              ${activeTab === 'users' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            用户管理
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all
              ${activeTab === 'invites' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            邀请码
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">加载中...</p>
          </div>
        )}

        {/* Users Tab */}
        {!isLoading && activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50/50">
              <p className="text-sm text-gray-500">共 {users.length} 个注册用户</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/30">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">活动</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">注册时间</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar displayName={u.displayName} avatar={u.avatar} size={32} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{u.displayName}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full
                          ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role === 'ADMIN' ? '管理员' : '用户'}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <div className="text-xs text-gray-500">
                          <span>{u._count?.notes ?? 0} 便签</span>
                          <span className="mx-1">·</span>
                          <span>{u._count?.replies ?? 0} 回复</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <p className="text-xs text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {u.id !== user?.id && (
                            <>
                              <button
                                onClick={() => handleToggleRole(u)}
                                className="text-xs px-2 py-1 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                title={u.role === 'ADMIN' ? '降级为用户' : '升级为管理员'}
                              >
                                {u.role === 'ADMIN' ? '降级' : '升级'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                删除
                              </button>
                            </>
                          )}
                          {u.id === user?.id && (
                            <span className="text-xs text-gray-400">当前用户</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invite Codes Tab */}
        {!isLoading && activeTab === 'invites' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800">生成邀请码</h3>
                <p className="text-sm text-gray-500 mt-1">邀请码有效期为15分钟，每个邀请码只能使用一次</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="收件邮箱（可选，填写后自动发送邀请邮件）"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 
                    focus:border-primary-400 focus:ring-2 focus:ring-primary-100 
                    transition-all duration-200 bg-white/50 text-sm"
                />
                <button
                  onClick={handleGenerateCode}
                  disabled={isSending}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 
                    text-white rounded-xl hover:from-primary-600 hover:to-primary-700 
                    transition-all font-medium text-sm shadow-sm whitespace-nowrap
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? '发送中...' : inviteEmail.trim() ? '生成并发送' : '生成邀请码'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-5 py-4 border-b bg-gray-50/50">
                <p className="text-sm text-gray-500">邀请码记录</p>
              </div>
              <div className="divide-y">
                {inviteCodes.length === 0 && (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">
                    暂无邀请码记录
                  </div>
                )}
                {inviteCodes.map((code) => {
                  const status = getCodeStatus(code)
                  const isActive = !code.used && new Date(code.expiresAt) > new Date()
                  return (
                    <div key={code.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <code className={`font-mono text-lg font-bold tracking-widest
                          ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                          {code.code}
                        </code>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${status.cls}`}>
                          {status.text}
                        </span>
                        {isActive && (
                          <span className="text-xs text-amber-600 hidden sm:inline">
                            剩余 {getRemainingTime(code.expiresAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-gray-400 hidden md:inline">
                          {code.creator?.displayName} · {new Date(code.createdAt).toLocaleString('zh-CN')}
                        </span>
                        {isActive && (
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="text-xs px-3 py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-primary-200"
                          >
                            复制
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
