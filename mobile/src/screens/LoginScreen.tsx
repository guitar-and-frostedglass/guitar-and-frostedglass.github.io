import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuthStore } from '../stores/authStore'
import { colors } from '../theme'
import type { RootStackParamList } from '../navigation'

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>

export default function LoginScreen({ navigation }: Props) {
  const { login, isLoading, error, clearError } = useAuthStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    try {
      await login({ identifier, password })
    } catch {
      // handled in store
    }
  }

  const handleChange = () => {
    if (error) clearError()
  }

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

        <View style={styles.card}>
          <Text style={styles.heading}>登录</Text>

          <Text style={styles.label}>邮箱或昵称</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={(v) => { setIdentifier(v); handleChange() }}
            placeholder="邮箱或昵称"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>密码</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(v) => { setPassword(v); handleChange() }}
            placeholder="••••••••"
            secureTextEntry
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>登录</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>
              还没有账号？<Text style={styles.linkBold}>立即注册</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary[50] },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', color: colors.gray[800], marginBottom: 32 },
  card: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, padding: 24 },
  heading: { fontSize: 22, fontWeight: '600', textAlign: 'center', color: colors.gray[800], marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: colors.gray[700], marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: colors.gray[200],
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
  },
  errorBox: { backgroundColor: colors.red[50], borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, marginTop: 12 },
  errorText: { fontSize: 13, color: colors.red[600] },
  button: {
    backgroundColor: colors.primary[500], borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14, color: colors.gray[600] },
  linkBold: { color: colors.primary[600], fontWeight: '600' },
})
