import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
  })
  const [validationError, setValidationError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) clearError()
    if (validationError) setValidationError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setValidationError('两次输入的密码不一致')
      return
    }
    
    if (formData.password.length < 6) {
      setValidationError('密码长度至少为6位')
      return
    }

    if (!formData.inviteCode.trim()) {
      setValidationError('请输入邀请码')
      return
    }

    try {
      await register({
        email: formData.email,
        displayName: formData.displayName,
        password: formData.password,
        inviteCode: formData.inviteCode.trim(),
      })
      navigate('/')
    } catch {
      // Error is handled in store
    }
  }

  const displayError = validationError || error

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎸</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Guitar & Frosted Glass
          </h1>
          <p className="text-gray-600">创建账号，开始记录</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            注册
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label 
                htmlFor="inviteCode" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                邀请码
              </label>
              <input
                type="text"
                id="inviteCode"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleChange}
                required
                placeholder="请输入邀请码"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 
                  focus:border-primary-400 focus:ring-2 focus:ring-primary-100 
                  transition-all duration-200 bg-white/50 font-mono tracking-widest text-center text-lg"
              />
              <p className="text-xs text-gray-400 mt-1">邀请码有效期15分钟，请尽快完成注册</p>
            </div>

            <div>
              <label 
                htmlFor="displayName" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                昵称
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
                placeholder="你的昵称"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 
                  focus:border-primary-400 focus:ring-2 focus:ring-primary-100 
                  transition-all duration-200 bg-white/50"
              />
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                邮箱
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 
                  focus:border-primary-400 focus:ring-2 focus:ring-primary-100 
                  transition-all duration-200 bg-white/50"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                密码
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="至少6位字符"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 
                  focus:border-primary-400 focus:ring-2 focus:ring-primary-100 
                  transition-all duration-200 bg-white/50"
              />
            </div>

            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                确认密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="再次输入密码"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 
                  focus:border-primary-400 focus:ring-2 focus:ring-primary-100 
                  transition-all duration-200 bg-white/50"
              />
            </div>

            {displayError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{displayError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 
                text-white font-medium rounded-xl shadow-md 
                hover:from-primary-600 hover:to-primary-700 
                focus:ring-2 focus:ring-primary-300 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                  注册中...
                </span>
              ) : (
                '创建账号'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              已有账号？{' '}
              <Link 
                to="/login" 
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
