import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Modal, TextInput, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useNoteStore } from '../stores/noteStore'
import { useAuthStore } from '../stores/authStore'
import UserAvatar from '../components/UserAvatar'
import { colors, noteColors, getRelativeTime } from '../theme'
import type { RootStackParamList } from '../navigation'
import type { Note, NoteColor } from '../../../shared/types'
import { NOTE_COLORS } from '../../../shared/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>

type TabKey = 'all' | 'recent' | 'unread' | 'drafts'

export default function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { notes, fetchNotes, reloadReadCounts, isLoading, isNoteUnread, readCounts, createNote } = useNoteStore()
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newColor, setNewColor] = useState<NoteColor>('yellow')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    reloadReadCounts()
    fetchNotes()
  }, [fetchNotes, reloadReadCounts])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchNotes()
    setRefreshing(false)
  }, [fetchNotes])

  const published = notes.filter((n) => n.status === 'PUBLISHED')
  const drafts = notes.filter((n) => n.status === 'DRAFT')
  const recent = published.filter((n) => {
    const neverOpened = readCounts[n.id] === undefined
    const noReplies = (n._count?.replies ?? 0) === 0
    return neverOpened && noReplies
  })
  const unread = published.filter((n) => isNoteUnread(n.id))

  const filtered: Note[] = (() => {
    switch (activeTab) {
      case 'recent': return recent
      case 'unread': return unread
      case 'drafts': return drafts
      default: return published
    }
  })()

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'all', label: '全部' },
    { key: 'recent', label: '最新', count: recent.length },
    { key: 'unread', label: '未读', count: unread.length },
    { key: 'drafts', label: '草稿', count: drafts.length },
  ]

  const handleCreate = async (isDraft: boolean) => {
    if (!newContent.trim()) return
    setCreating(true)
    try {
      const note = await createNote({ title: newTitle.trim(), content: newContent.trim(), color: newColor, isDraft })
      setShowCreate(false)
      setNewTitle('')
      setNewContent('')
      setNewColor('yellow')
      if (!isDraft) navigation.navigate('NoteThread', { noteId: note.id })
    } catch { /* handled in store */ }
    setCreating(false)
  }

  const renderNote = ({ item }: { item: Note }) => {
    const nc = noteColors[item.color]
    const isUnread = isNoteUnread(item.id)
    const replyCount = item._count?.replies ?? 0

    return (
      <TouchableOpacity
        style={[styles.noteCard, { backgroundColor: nc.bg, borderColor: nc.border }]}
        onPress={() => navigation.navigate('NoteThread', { noteId: item.id })}
        activeOpacity={0.7}
      >
        {item.status === 'DRAFT' && (
          <View style={styles.draftBadge}><Text style={styles.draftText}>草稿</Text></View>
        )}
        <View style={styles.noteHeader}>
          <UserAvatar displayName={item.user?.displayName} avatar={item.user?.avatar} size={28} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.noteAuthor} numberOfLines={1}>{item.user?.displayName || '匿名'}</Text>
            <Text style={styles.noteTime}>{getRelativeTime(item.createdAt)}</Text>
          </View>
        </View>
        {item.title ? <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text> : null}
        <Text style={styles.noteContent} numberOfLines={3}>{item.content || '...'}</Text>
        <View style={styles.noteFooter}>
          <Text style={styles.replyCount}>{replyCount} 条回复</Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <UserAvatar displayName={user?.displayName} avatar={user?.avatar} size={36} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎸 便签</Text>
        <View style={styles.headerRight}>
          {user?.role === 'ADMIN' && (
            <TouchableOpacity onPress={() => navigation.navigate('Admin')} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>管理</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={logout} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: colors.red[500] }]}>退出</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count !== undefined && tab.count > 0 && activeTab !== tab.key && (
              <View style={styles.badge}><Text style={styles.badgeText}>{tab.count}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Note list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderNote}
        contentContainerStyle={styles.list}
        numColumns={1}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}><ActivityIndicator size="large" color={colors.primary[500]} /></View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>暂无便签</Text>
              <Text style={styles.emptySub}>点击右下角按钮创建</Text>
            </View>
          )
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => setShowCreate(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create Note Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>新建便签</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={styles.modalClose}>取消</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="标题（可选）"
              maxLength={100}
            />
            <TextInput
              style={[styles.modalInput, { height: 120, textAlignVertical: 'top' }]}
              value={newContent}
              onChangeText={setNewContent}
              placeholder="写点什么..."
              multiline
            />
            <View style={styles.colorRow}>
              {NOTE_COLORS.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[
                    styles.colorDot,
                    { backgroundColor: noteColors[c.value].border },
                    newColor === c.value && styles.colorDotActive,
                  ]}
                  onPress={() => setNewColor(c.value)}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => handleCreate(true)}
                disabled={creating}
              >
                <Text style={styles.modalBtnSecondaryText}>存为草稿</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, (!newContent.trim() || creating) && { opacity: 0.5 }]}
                onPress={() => handleCreate(false)}
                disabled={!newContent.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>发布</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[50] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.gray[800], marginLeft: 12 },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  headerBtnText: { fontSize: 14, fontWeight: '500', color: colors.primary[600] },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.gray[100], flexDirection: 'row', alignItems: 'center' },
  tabActive: { backgroundColor: colors.white },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.gray[500] },
  tabTextActive: { color: colors.gray[800] },
  badge: { backgroundColor: colors.primary[500], borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 100 },
  noteCard: { borderWidth: 2, borderRadius: 14, padding: 14, marginBottom: 12 },
  draftBadge: { position: 'absolute', top: -10, left: 12, backgroundColor: colors.gray[600], borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  draftText: { color: colors.white, fontSize: 11, fontWeight: '600' },
  noteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  noteAuthor: { fontSize: 12, fontWeight: '600', color: colors.gray[600] },
  noteTime: { fontSize: 11, color: colors.gray[400] },
  noteTitle: { fontSize: 15, fontWeight: '700', color: colors.gray[800], marginBottom: 4 },
  noteContent: { fontSize: 14, color: colors.gray[600], lineHeight: 20 },
  noteFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  replyCount: { fontSize: 12, color: colors.gray[400] },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[500], marginLeft: 'auto' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, color: colors.gray[500] },
  emptySub: { fontSize: 14, color: colors.gray[400], marginTop: 4 },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  fabText: { fontSize: 28, color: colors.white, fontWeight: '300', marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[800] },
  modalClose: { fontSize: 14, color: colors.primary[600] },
  modalInput: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, marginBottom: 10, backgroundColor: colors.gray[50] },
  colorRow: { flexDirection: 'row', gap: 10, marginVertical: 10 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 3, borderColor: colors.gray[800] },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnSecondary: { backgroundColor: colors.gray[100] },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: colors.gray[600] },
  modalBtnPrimary: { backgroundColor: colors.primary[500] },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: '600', color: colors.white },
})
