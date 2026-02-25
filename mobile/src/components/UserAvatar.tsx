import { View, Text, Image, StyleSheet } from 'react-native'
import { colors } from '../theme'

interface Props {
  displayName?: string
  avatar?: string | null
  size?: number
}

export default function UserAvatar({ displayName, avatar, size = 32 }: Props) {
  const initials = (displayName || '?')[0].toUpperCase()
  const fontSize = size * 0.4

  if (avatar) {
    return (
      <Image
        source={{ uri: avatar }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    )
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initial, { fontSize }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.gray[200],
  },
  fallback: {
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.white,
    fontWeight: '700',
  },
})
