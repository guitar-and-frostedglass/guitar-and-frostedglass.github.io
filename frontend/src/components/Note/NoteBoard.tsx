import { useState } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import NoteCard from './NoteCard'

type TabKey = 'all' | 'recent' | 'unread' | 'drafts'

export default function NoteBoard() {
  const { notes, isNoteUnread, readCounts } = useNoteStore()
  const [activeTab, setActiveTab] = useState<TabKey>('all')

  const published = notes.filter((n) => n.status === 'PUBLISHED')
  const drafts = notes.filter((n) => n.status === 'DRAFT')
  const recent = published.filter((n) => {
    const neverOpened = readCounts[n.id] === undefined
    const noReplies = (n._count?.replies ?? 0) === 0
    return neverOpened && noReplies
  })
  const unread = published.filter((n) => isNoteUnread(n.id))

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'all', label: '全部' },
    { key: 'recent', label: '最新', count: recent.length },
    { key: 'unread', label: '未读', count: unread.length },
    { key: 'drafts', label: '草稿', count: drafts.length },
  ]

  const filtered: typeof notes = (() => {
    switch (activeTab) {
      case 'recent': return recent
      case 'unread': return unread
      case 'drafts': return drafts
      default: return published
    }
  })()

  const emptyHints: Record<TabKey, { icon: string; title: string; sub: string }> = {
    all: { icon: '📝', title: '还没有便签', sub: '点击右下角的 + 按钮创建第一个话题' },
    recent: { icon: '🆕', title: '没有新便签', sub: '所有便签都已阅读或已有回复' },
    unread: { icon: '✅', title: '全部已读', sub: '没有包含未读回复的便签' },
    drafts: { icon: '📄', title: '没有草稿', sub: '创建便签时可以选择存为草稿' },
  }

  const hint = emptyHints[activeTab]

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          const showBadge = tab.count !== undefined && tab.count > 0 && !isActive
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
            >
              {tab.label}
              {showBadge && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center
                  px-1 text-[10px] font-bold leading-none text-white bg-primary-500 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Note grid */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center text-gray-500">
            <div className="text-5xl mb-3">{hint.icon}</div>
            <p className="text-lg">{hint.title}</p>
            <p className="text-sm mt-1">{hint.sub}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}
