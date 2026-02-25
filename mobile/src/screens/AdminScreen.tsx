import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, TextInput, ActivityIndicator, FlatList,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuthStore } from '../stores/authStore'
import { adminService } from '../services/adminService'
import UserAvatar from '../components/UserAvatar'
import { colors } from '../theme'
import type { RootStackParamList } from '../navigation'
import type { AdminUser, InviteCode, DeletedReply, DeletedNote } from '../../../shared/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>
type TabKey = 'users' | 'invites' | 'deleted-notes' | 'deleted-replies'

export default function AdminScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabKey>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [deletedReplies, setDeletedReplies] = useState<DeletedReply[]>([])
  const [deletedNotes, setDeletedNotes] = useState<DeletedNote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000) }

  const loadTab = useCallback(async (tab: TabKey) => {
    setIsLoading(true)
    try {
      if (tab === 'users') setUsers(await adminService.getUsers())
      else if (tab === 'invites') setInviteCodes(await adminService.getInviteCodes())
      else if (tab === 'deleted-notes') setDeletedNotes(await adminService.getDeletedNotes())
      else setDeletedReplies(await adminService.getDeletedReplies())
    } catch (err) {
      Alert.alert('错误', err instanceof Error ? err.message : '加载失败')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { loadTab(activeTab) }, [activeTab, loadTab])

  const handleDeleteUser = (id: string) => {
    Alert.alert('确认', '确定删除该用户？此操作不可撤销。', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        try { await adminService.deleteUser(id); setUsers((p) => p.filter((u) => u.id !== id)); showToast('用户已删除') }
        catch (e) { Alert.alert('错误', e instanceof Error ? e.message : '删除失败') }
      }},
    ])
  }

  const handleToggleRole = async (u: AdminUser) => {
    const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN'
    try {
      await adminService.updateUserRole(u.id, newRole)
      setUsers((p) => p.map((x) => x.id === u.id ? { ...x, role: newRole } : x))
      showToast(`已更新 ${u.displayName} 的角色`)
    } catch (e) { Alert.alert('错误', e instanceof Error ? e.message : '更新失败') }
  }

  const handleGenerateCode = async () => {
    const emailVal = inviteEmail.trim() || undefined
    setIsSending(true)
    try {
      const result = await adminService.generateInviteCode(emailVal)
      setInviteCodes((p) => [result, ...p])
      showToast(emailVal && result.emailSent ? `邮件已发送至 ${emailVal}` : '邀请码已生成')
      setInviteEmail('')
    } catch (e) { Alert.alert('错误', e instanceof Error ? e.message : '生成失败') }
    setIsSending(false)
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'users', label: '用户' },
    { key: 'invites', label: '邀请码' },
    { key: 'deleted-notes', label: '便签回收站' },
    { key: 'deleted-replies', label: '回复记录' },
  ]

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>管理后台</Text>
        <View style={{ width: 40 }} />
      </View>

      {toast && <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabBar}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary[500]} /></View>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          {activeTab === 'users' && users.map((u) => (
            <View key={u.id} style={styles.card}>
              <View style={styles.row}>
                <UserAvatar displayName={u.displayName} avatar={u.avatar} size={36} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.displayName}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{u.role === 'ADMIN' ? '管理员' : '用户'}</Text>
                </View>
              </View>
              {u.id !== user?.id && (
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleToggleRole(u)}>
                    <Text style={styles.actionLink}>{u.role === 'ADMIN' ? '降级' : '升级'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteUser(u.id)}>
                    <Text style={[styles.actionLink, { color: colors.red[500] }]}>删除</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {activeTab === 'invites' && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>生成邀请码</Text>
                <TextInput
                  style={styles.input}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="收件邮箱（可选）"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, isSending && { opacity: 0.5 }]}
                  onPress={handleGenerateCode}
                  disabled={isSending}
                >
                  <Text style={styles.primaryBtnText}>{isSending ? '生成中...' : '生成邀请码'}</Text>
                </TouchableOpacity>
              </View>
              {inviteCodes.map((c) => {
                const isUsed = c.used
                const isExpired = new Date(c.expiresAt) < new Date()
                const isActive = !isUsed && !isExpired
                return (
                  <View key={c.id} style={styles.card}>
                    <View style={styles.row}>
                      <Text style={[styles.codeText, !isActive && { color: colors.gray[400] }]}>{c.code}</Text>
                      <View style={[styles.statusBadge, isUsed ? styles.usedBadge : isExpired ? styles.expiredBadge : styles.activeBadge]}>
                        <Text style={styles.statusText}>{isUsed ? '已使用' : isExpired ? '已过期' : '有效'}</Text>
                      </View>
                    </View>
                    {isActive && (
                      <TouchableOpacity onPress={() => { Alert.alert('邀请码', c.code); showToast('请手动复制') }}>
                        <Text style={styles.actionLink}>查看</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )
              })}
            </>
          )}

          {activeTab === 'deleted-notes' && deletedNotes.map((dn) => (
            <View key={dn.id} style={styles.card}>
              <Text style={styles.cardTitle}>{dn.title || '无标题'}</Text>
              <Text style={styles.cardSub}>by {dn.noteUserName}</Text>
              <Text style={styles.cardBody} numberOfLines={3}>{dn.content}</Text>
              <Text style={styles.cardMeta}>{new Date(dn.deletedAt).toLocaleString('zh-CN')} 删除</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => {
                  Alert.alert('确认', '恢复这个便签？', [
                    { text: '取消', style: 'cancel' },
                    { text: '恢复', onPress: async () => {
                      try { await adminService.restoreNote(dn.id); setDeletedNotes((p) => p.filter((n) => n.id !== dn.id)); showToast('已恢复') }
                      catch (e) { Alert.alert('错误', e instanceof Error ? e.message : '恢复失败') }
                    }},
                  ])
                }}>
                  <Text style={[styles.actionLink, { color: colors.green[600] }]}>恢复</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  Alert.alert('确认', '彻底删除？此操作不可撤销。', [
                    { text: '取消', style: 'cancel' },
                    { text: '彻底删除', style: 'destructive', onPress: async () => {
                      try { await adminService.permanentlyDeleteNote(dn.id); setDeletedNotes((p) => p.filter((n) => n.id !== dn.id)); showToast('已彻底删除') }
                      catch (e) { Alert.alert('错误', e instanceof Error ? e.message : '删除失败') }
                    }},
                  ])
                }}>
                  <Text style={[styles.actionLink, { color: colors.red[500] }]}>彻底删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {activeTab === 'deleted-replies' && deletedReplies.map((dr) => (
            <View key={dr.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.userName}>{dr.replyUserName}</Text>
                <Text style={styles.cardSub}>的回复</Text>
              </View>
              <Text style={styles.cardBody}>{dr.content}</Text>
              <Text style={styles.cardMeta}>
                {new Date(dr.deletedAt).toLocaleString('zh-CN')} 删除
                {dr.replyUserId !== dr.deletedById ? ` · 由 ${dr.deletedByName} 删除` : ' · 自行删除'}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  backBtn: { padding: 8 },
  backText: { fontSize: 22, color: colors.gray[600] },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.gray[800] },
  toast: { position: 'absolute', top: 100, alignSelf: 'center', zIndex: 100, backgroundColor: colors.green[50], borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  toastText: { fontSize: 13, color: colors.green[600] },
  tabScroll: { maxHeight: 50, backgroundColor: colors.white },
  tabBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.gray[100] },
  tabActive: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200] },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.gray[500] },
  tabTextActive: { color: colors.gray[800] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 16 },
  card: { backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.gray[100] },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[800], marginBottom: 4 },
  cardSub: { fontSize: 12, color: colors.gray[500] },
  cardBody: { fontSize: 14, color: colors.gray[700], marginVertical: 6, lineHeight: 20 },
  cardMeta: { fontSize: 11, color: colors.gray[400] },
  cardActions: { flexDirection: 'row', gap: 20, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: colors.gray[800] },
  userEmail: { fontSize: 12, color: colors.gray[500] },
  roleBadge: { backgroundColor: colors.gray[100], borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  roleText: { fontSize: 11, fontWeight: '500', color: colors.gray[600] },
  actionLink: { fontSize: 13, fontWeight: '500', color: colors.primary[600] },
  input: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginVertical: 8, backgroundColor: colors.gray[50] },
  primaryBtn: { backgroundColor: colors.primary[500], borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  codeText: { fontFamily: 'Courier', fontSize: 18, fontWeight: '700', color: colors.gray[800], letterSpacing: 2 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  activeBadge: { backgroundColor: colors.green[50] },
  usedBadge: { backgroundColor: colors.gray[100] },
  expiredBadge: { backgroundColor: colors.red[50] },
  statusText: { fontSize: 11, fontWeight: '500' },
})
