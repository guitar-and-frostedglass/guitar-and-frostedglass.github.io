import type { NoteColor } from '../../shared/types'

export const colors = {
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
  },
  red: { 50: '#FEF2F2', 500: '#EF4444', 600: '#DC2626' },
  green: { 50: '#F0FDF4', 500: '#22C55E', 600: '#16A34A' },
  amber: { 50: '#FFFBEB', 100: '#FEF3C7', 400: '#FBBF24' },
  white: '#FFFFFF',
}

export const noteColors: Record<NoteColor, { bg: string; border: string; accent: string }> = {
  yellow: { bg: '#FFFBEB', border: '#FDE68A', accent: '#FEF3C7' },
  pink: { bg: '#FDF2F8', border: '#F9A8D4', accent: '#FCE7F3' },
  blue: { bg: '#EFF6FF', border: '#93C5FD', accent: '#DBEAFE' },
  green: { bg: '#F0FDF4', border: '#86EFAC', accent: '#DCFCE7' },
  purple: { bg: '#FAF5FF', border: '#C4B5FD', accent: '#EDE9FE' },
  orange: { bg: '#FFF7ED', border: '#FDBA74', accent: '#FFEDD5' },
}

export function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
