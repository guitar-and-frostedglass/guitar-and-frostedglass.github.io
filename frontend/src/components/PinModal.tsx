import { useState, useEffect, useCallback } from 'react'
import { useLayerStore } from '../stores/layerStore'
import { authService } from '../services/authService'

const PIN_LENGTH = 4

type Mode = 'loading' | 'verify' | 'setup' | 'confirm'

export default function PinModal() {
  const { showPinModal, closePinModal, unlock } = useLayerStore()
  const [mode, setMode] = useState<Mode>('loading')
  const [pin, setPin] = useState('')
  const [setupPin, setSetupPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (!showPinModal) return
    setPin('')
    setSetupPin('')
    setError('')
    setMode('loading')

    authService.hasSecondaryPin().then((hasPin) => {
      setMode(hasPin ? 'verify' : 'setup')
    }).catch(() => {
      setMode('setup')
    })
  }, [showPinModal])

  const triggerShake = useCallback(() => {
    setShake(true)
    setTimeout(() => {
      setShake(false)
      setPin('')
    }, 500)
  }, [])

  const handleComplete = useCallback(async (enteredPin: string) => {
    if (mode === 'verify') {
      try {
        const ok = await authService.verifySecondaryPin(enteredPin)
        if (ok) {
          unlock()
        } else {
          setError('密码错误')
          triggerShake()
        }
      } catch {
        setError('密码错误')
        triggerShake()
      }
    } else if (mode === 'setup') {
      setSetupPin(enteredPin)
      setPin('')
      setError('')
      setMode('confirm')
    } else if (mode === 'confirm') {
      if (enteredPin === setupPin) {
        try {
          await authService.setSecondaryPin(enteredPin)
          unlock()
        } catch {
          setError('设置失败，请重试')
          setSetupPin('')
          setPin('')
          setMode('setup')
        }
      } else {
        setError('两次输入不一致')
        triggerShake()
        setTimeout(() => {
          setError('')
          setSetupPin('')
          setMode('setup')
        }, 1200)
      }
    }
  }, [mode, setupPin, unlock, triggerShake])

  const handleDigit = useCallback((digit: string) => {
    setError('')
    setPin((prev) => {
      const next = prev + digit
      if (next.length === PIN_LENGTH) {
        setTimeout(() => handleComplete(next), 150)
      }
      return next.length <= PIN_LENGTH ? next : prev
    })
  }, [handleComplete])

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1))
  }, [])

  useEffect(() => {
    if (!showPinModal) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePinModal()
      } else if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspace()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showPinModal, handleDigit, handleBackspace, closePinModal])

  if (!showPinModal) return null

  const title = mode === 'loading' ? '' :
    mode === 'verify' ? '输入密码' :
    mode === 'setup' ? '设置密码' : '确认密码'

  const subtitle = mode === 'setup' ? '设置4位数字密码以保护里便签' :
    mode === 'confirm' ? '再次输入以确认' : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xs mx-auto flex flex-col items-center pt-16 pb-8 px-4">
        <button
          onClick={closePinModal}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>

        <h2 className="text-white text-xl font-semibold mb-1">{title}</h2>
        {subtitle && <p className="text-white/50 text-sm mb-6">{subtitle}</p>}

        <div className={`flex gap-4 mb-2 mt-4 ${shake ? 'animate-shake' : ''}`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                i < pin.length
                  ? 'bg-white border-white scale-110'
                  : 'border-white/40'
              }`}
            />
          ))}
        </div>

        <div className="h-6 mt-2 mb-4">
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {mode !== 'loading' && (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => handleDigit(String(n))}
                className="w-18 h-18 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-2xl font-light flex items-center justify-center transition-colors"
                style={{ width: '72px', height: '72px' }}
              >
                {n}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleDigit('0')}
              className="w-18 h-18 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-2xl font-light flex items-center justify-center transition-colors"
              style={{ width: '72px', height: '72px' }}
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="w-18 h-18 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
              style={{ width: '72px', height: '72px' }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414A2 2 0 0110.828 5H20a1 1 0 011 1v12a1 1 0 01-1 1h-9.172a2 2 0 01-1.414-.586L3 12z" />
              </svg>
            </button>
          </div>
        )}

        {mode === 'loading' && (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white"></div>
          </div>
        )}
      </div>
    </div>
  )
}
