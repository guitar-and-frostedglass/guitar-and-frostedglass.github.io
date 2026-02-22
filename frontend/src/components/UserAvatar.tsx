interface UserAvatarProps {
  displayName?: string
  avatar?: string | null
  size?: number
  gradient?: string
}

export default function UserAvatar({
  displayName,
  avatar,
  size = 32,
  gradient = 'from-primary-400 to-primary-600',
}: UserAvatarProps) {
  const initial = displayName?.[0]?.toUpperCase() || '?'
  const fontSize = size <= 24 ? 'text-xs' : size <= 32 ? 'text-sm' : 'text-base'

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={displayName || ''}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0 ${fontSize}`}
    >
      {initial}
    </div>
  )
}
