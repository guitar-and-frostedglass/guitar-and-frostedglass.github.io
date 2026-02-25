import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuthStore } from '../stores/authStore'
import { colors } from '../theme'
import type { RootStackParamList } from '../navigation'

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>

export default function RegisterScreen({ navigation, route }: Props) {
  const { register, isLoading, error, clearError } = useAuthStore()
  const [inviteCode, setInviteCode] = useState(route.params?.code || '')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleChange = () => {
    if (error) clearError()
    if (localError) setLocalError('')
  }

  const handleRegister = async () => {
    if (password !== confirmPassword) { setLocalError('两次输入的密码不一致'); return }
    if (password.length < 6) { setLocalError('密码长度至少为6位'); return }
    if (!inviteCode.trim()) { setLocalError('请输入邀请码'); return }

    try {
      await register({
        email,
        displayName,
        password,
        inviteCode: inviteCode.trim(),
      })
    } catch {
      // handled in store
    }
  }

  const displayError = localError || error

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>🎸</Text>
        <Text style={styles.title}>Guitar & Frosted Glass</Text>
        <Text style={styles.subtitle}>创建账号，开始记录</Text>

        <View style={styles.card}>
          <Text style={styles.heading}>注册</Text>

          <Text style={styles.label}>邀请码</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={inviteCode}
            onChangeText={(v) => { setInviteCode(v); handleChange() }}
            placeholder="请输入邀请码"
            autoCapitalize="none"
          />
          <Text style={styles.hint}>邀请码有效期15分钟，请尽快完成注册</Text>

          <Text style={styles.label}>昵称</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={(v) => { setDisplayName(v); handleChange() }}
            placeholder="你的昵称"
          />

          <Text style={styles.label}>邮箱</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(v) => { setEmail(v); handleChange() }}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>密码</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(v) => { setPassword(v); handleChange() }}
            placeholder="至少6位字符"
            secureTextEntry
          />

          <Text style={styles.label}>确认密码</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); handleChange() }}
            placeholder="再次输入密码"
            secureTextEntry
          />

          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>创建账号</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              已有账号？<Text style={styles.linkBold}>立即登录</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[50] },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 48 },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', color: colors.gray[800] },
  subtitle: { fontSize: 14, textAlign: 'center', color: colors.gray[500], marginBottom: 24 },
  card: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, padding: 24 },
  heading: { fontSize: 22, fontWeight: '600', textAlign: 'center', color: colors.gray[800], marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: colors.gray[700], marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: colors.gray[200],
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
  },
  codeInput: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', textAlign: 'center', fontSize: 18, letterSpacing: 4 },
  hint: { fontSize: 11, color: colors.gray[400], marginTop: 4 },
  errorBox: { backgroundColor: colors.red[50], borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, marginTop: 12 },
  errorText: { fontSize: 13, color: colors.red[600] },
  button: { backgroundColor: colors.primary[500], borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14, color: colors.gray[600] },
  linkBold: { color: colors.primary[600], fontWeight: '600' },
})
