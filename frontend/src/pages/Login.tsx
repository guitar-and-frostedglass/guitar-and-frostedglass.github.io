import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(formData)
      navigate('/')
    } catch {
      // Error is handled in store
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎸</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Guitar & Frosted Glass
          </h1>
          <p className="text-gray-600">共享日记，记录美好时刻</p>
        </div>

        {/* Login Form */}
        <div className="glass rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            登录
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label 
                htmlFor="identifier" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                邮箱或昵称
              </label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                required
                placeholder="邮箱或昵称"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 
                  focus:border-primary-400 focus:ring-2 focus:ring-primary-100 
                  transition-all duration-200 bg-white/50"
              />
            </div>

            {/* Password */}
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
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 
                  focus:border-primary-400 focus:ring-2 focus:ring-primary-100 
                  transition-all duration-200 bg-white/50"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
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
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              还没有账号？{' '}
              <Link 
                to="/register" 
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

