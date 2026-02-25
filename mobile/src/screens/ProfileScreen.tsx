import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/authService'
import UserAvatar from '../components/UserAvatar'
import { colors } from '../theme'
import type { RootStackParamList } from '../navigation'

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>

export default function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { user, updateAvatar, updateProfile } = useAuthStore()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const hasChanges = displayName !== user?.displayName || email !== user?.email

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    })

    if (!result.canceled && result.assets[0].base64) {
      const mime = result.assets[0].mimeType || 'image/jpeg'
      const dataUri = `data:${mime};base64,${result.assets[0].base64}`
      try {
        await updateAvatar(dataUri)
      } catch (err) {
        Alert.alert('错误', err instanceof Error ? err.message : '更新头像失败')
      }
    }
  }

  const handleProfileSave = async () => {
    setProfileMsg(null)
    if (!displayName.trim()) { setProfileMsg({ type: 'error', text: '昵称不能为空' }); return }
    if (displayName.trim().length > 50) { setProfileMsg({ type: 'error', text: '昵称长度不能超过50个字符' }); return }

    setProfileLoading(true)
    try {
      await updateProfile(displayName.trim(), email)
      setProfileMsg({ type: 'success', text: '资料已更新' })
      setTimeout(() => setProfileMsg(null), 3000)
    } catch (err) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : '更新资料失败' })
    }
    setProfileLoading(false)
  }

  const handlePasswordChange = async () => {
    setPwMsg(null)
    if (newPassword.length < 6) { setPwMsg({ type: 'error', text: '新密码长度至少为6位' }); return }
    if (newPassword !== confirmPassword) { setPwMsg({ type: 'error', text: '两次输入的新密码不一致' }); return }

    setPwLoading(true)
    try {
      await authService.changePassword(currentPassword, newPassword)
      setPwMsg({ type: 'success', text: '密码修改成功' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwMsg(null), 3000)
    } catch (err) {
      setPwMsg({ type: 'error', text: err instanceof Error ? err.message : '修改密码失败' })
    }
    setPwLoading(false)
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>个人资料</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        {/* Avatar */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar}>
            <UserAvatar displayName={user?.displayName} avatar={user?.avatar} size={96} />
            <Text style={styles.avatarHint}>点击更换头像</Text>
          </TouchableOpacity>
        </View>

        {/* Profile form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>

          <Text style={styles.label}>昵称</Text>
          <TextInput style={styles.input} value={displayName} onChangeText={(v) => { setDisplayName(v); setProfileMsg(null) }} maxLength={50} />
          <Text style={styles.hint}>昵称是唯一的，也可以用于登录</Text>

          <Text style={styles.label}>邮箱</Text>
          <TextInput style={styles.input} value={email} onChangeText={(v) => { setEmail(v); setProfileMsg(null) }} keyboardType="email-address" autoCapitalize="none" />

          {profileMsg && (
            <View style={[styles.msgBox, profileMsg.type === 'error' ? styles.msgError : styles.msgSuccess]}>
              <Text style={profileMsg.type === 'error' ? styles.msgErrorText : styles.msgSuccessText}>{profileMsg.text}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, (!hasChanges || profileLoading) && { opacity: 0.5 }]}
            onPress={handleProfileSave}
            disabled={!hasChanges || profileLoading}
          >
            {profileLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.primaryBtnText}>保存修改</Text>}
          </TouchableOpacity>
        </View>

        {/* Password */}
        <View style={styles.section}>
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.collapseHeader}>
            <Text style={styles.sectionTitle}>修改密码</Text>
            <Text style={styles.chevron}>{showPassword ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showPassword && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>当前密码</Text>
              <TextInput style={styles.input} value={currentPassword} onChangeText={(v) => { setCurrentPassword(v); setPwMsg(null) }} secureTextEntry />

              <Text style={styles.label}>新密码</Text>
              <TextInput style={styles.input} value={newPassword} onChangeText={(v) => { setNewPassword(v); setPwMsg(null) }} secureTextEntry placeholder="至少6位字符" />

              <Text style={styles.label}>确认新密码</Text>
              <TextInput style={styles.input} value={confirmPassword} onChangeText={(v) => { setConfirmPassword(v); setPwMsg(null) }} secureTextEntry />

              {pwMsg && (
                <View style={[styles.msgBox, pwMsg.type === 'error' ? styles.msgError : styles.msgSuccess]}>
                  <Text style={pwMsg.type === 'error' ? styles.msgErrorText : styles.msgSuccessText}>{pwMsg.text}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, pwLoading && { opacity: 0.5 }]}
                onPress={handlePasswordChange}
                disabled={pwLoading}
              >
                {pwLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.primaryBtnText}>确认修改</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[50] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  backBtn: { padding: 8 },
  backText: { fontSize: 22, color: colors.gray[600] },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: colors.gray[800] },
  content: { padding: 16 },
  section: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 16, padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[800] },
  avatarWrapper: { alignItems: 'center', gap: 8 },
  avatarHint: { fontSize: 13, color: colors.gray[500] },
  label: { fontSize: 13, fontWeight: '500', color: colors.gray[700], marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: 'rgba(255,255,255,0.5)' },
  hint: { fontSize: 11, color: colors.gray[400], marginTop: 4 },
  primaryBtn: { backgroundColor: colors.primary[500], borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  collapseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chevron: { fontSize: 12, color: colors.gray[400] },
  msgBox: { borderRadius: 10, padding: 10, marginTop: 12 },
  msgError: { backgroundColor: colors.red[50], borderWidth: 1, borderColor: '#FECACA' },
  msgSuccess: { backgroundColor: colors.green[50], borderWidth: 1, borderColor: '#BBF7D0' },
  msgErrorText: { fontSize: 13, color: colors.red[600] },
  msgSuccessText: { fontSize: 13, color: colors.green[600] },
})
