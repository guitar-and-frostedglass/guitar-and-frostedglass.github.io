import { useState, useEffect, useRef } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useNoteStore } from '../stores/noteStore'
import { useAuthStore } from '../stores/authStore'
import UserAvatar from '../components/UserAvatar'
import { colors, noteColors, getRelativeTime } from '../theme'
import type { RootStackParamList } from '../navigation'
import type { NoteColor, Reply } from '../../../shared/types'

type Props = NativeStackScreenProps<RootStackParamList, 'NoteThread'>

export default function NoteThreadScreen({ route, navigation }: Props) {
  const { noteId } = route.params
  const insets = useSafeAreaInsets()
  const { activeNote, fetchNote, setActiveNote, createReply, deleteReply, updateReply, updateNote, publishNote, markNoteRead } = useNoteStore()
  const { user } = useAuthStore()
  const [replyContent, setReplyContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Reply | null>(null)
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [editingReplyContent, setEditingReplyContent] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const listRef = useRef<FlatList>(null)
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    fetchNote(noteId)
    markNoteRead(noteId)
    return () => { setActiveNote(null) }
  }, [noteId, fetchNote, markNoteRead, setActiveNote])

  if (!activeNote) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    )
  }

  const color = activeNote.color as NoteColor
  const nc = noteColors[color]
  const isNoteOwner = user?.id === activeNote.userId
  const isDraft = activeNote.status === 'DRAFT'

  const handleSend = async () => {
    if (!replyContent.trim() || isSending) return
    setIsSending(true)
    try {
      await createReply(activeNote.id, replyContent.trim(), replyingTo?.id)
      setReplyContent('')
      setReplyingTo(null)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200)
    } catch { /* handled */ }
    setIsSending(false)
  }

  const handleDelete = (replyId: string) => {
    Alert.alert('确认', '删除这条回复？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteReply(activeNote.id, replyId) },
    ])
  }

  const handleSaveReply = async () => {
    if (!editingReplyId || !editingReplyContent.trim()) return
    try {
      await updateReply(activeNote.id, editingReplyId, editingReplyContent.trim())
      setEditingReplyId(null)
      setEditingReplyContent('')
    } catch { /* handled */ }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try { await publishNote(activeNote.id) } catch { /* handled */ }
    setIsPublishing(false)
  }

  const renderReply = ({ item }: { item: Reply }) => {
    const isMe = item.userId === user?.id
    const canDelete = isMe || isAdmin
    const isEditing = editingReplyId === item.id

    return (
      <View style={styles.replyRow}>
        <UserAvatar displayName={item.user?.displayName} avatar={item.user?.avatar} size={32} />
        <View style={styles.replyBody}>
          <View style={styles.replyMeta}>
            <Text style={styles.replyAuthor}>{item.user?.displayName}</Text>
            <Text style={styles.replyTime}>{getRelativeTime(item.createdAt)}</Text>
          </View>

          {item.replyTo && (
            <View style={styles.quotedReply}>
              <Text style={styles.quotedAuthor}>{item.replyTo.user?.displayName}</Text>
              <Text style={styles.quotedContent} numberOfLines={2}>{item.replyTo.content}</Text>
            </View>
          )}
          {item.replyToId && !item.replyTo && (
            <View style={styles.quotedReply}>
              <Text style={styles.quotedDeleted}>该回复已被删除</Text>
            </View>
          )}

          {isEditing ? (
            <View style={styles.editBox}>
              <TextInput
                style={styles.editInput}
                value={editingReplyContent}
                onChangeText={setEditingReplyContent}
                multiline
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => { setEditingReplyId(null); setEditingReplyContent('') }}>
                  <Text style={styles.editCancel}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveReply}>
                  <Text style={styles.editSave}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.replyBubble, isMe && styles.replyBubbleMine]}>
              <Text style={styles.replyText}>{item.content}</Text>
            </View>
          )}

          {!isEditing && (
            <View style={styles.replyActions}>
              {!isDraft && (
                <TouchableOpacity onPress={() => setReplyingTo(item)}>
                  <Text style={styles.actionText}>回复</Text>
                </TouchableOpacity>
              )}
              {isMe && (
                <TouchableOpacity onPress={() => { setEditingReplyId(item.id); setEditingReplyContent(item.content) }}>
                  <Text style={styles.actionText}>编辑</Text>
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={[styles.actionText, { color: colors.red[500] }]}>删除</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    )
  }

  const headerComponent = (
    <View style={[styles.noteSection, { backgroundColor: nc.accent }]}>
      <View style={styles.noteHeaderRow}>
        <UserAvatar displayName={activeNote.user?.displayName} avatar={activeNote.user?.avatar} size={36} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.noteAuthorName}>{activeNote.user?.displayName}</Text>
          <Text style={styles.noteDate}>{new Date(activeNote.createdAt).toLocaleString('zh-CN')}</Text>
        </View>
        {isNoteOwner && !isDraft && (
          <TouchableOpacity onPress={() => {
            Alert.prompt?.('编辑内容', undefined, async (text) => {
              if (text !== undefined) await updateNote(activeNote.id, { content: text })
            }, 'plain-text', activeNote.content)
          }}>
            <Text style={styles.actionText}>编辑</Text>
          </TouchableOpacity>
        )}
      </View>
      {activeNote.title ? <Text style={styles.noteFullTitle}>{activeNote.title}</Text> : null}
      <Text style={styles.noteFullContent}>{activeNote.content}</Text>
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header bar */}
      <View style={[styles.topBar, { backgroundColor: nc.accent, borderBottomColor: nc.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle} numberOfLines={1}>{activeNote.title || '无标题'}</Text>
          {isDraft && <Text style={styles.draftLabel}>草稿</Text>}
        </View>
        {isDraft && isNoteOwner && (
          <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={isPublishing}>
            <Text style={styles.publishText}>{isPublishing ? '...' : '发布'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={activeNote.replies || []}
        keyExtractor={(item) => item.id}
        renderItem={renderReply}
        ListHeaderComponent={headerComponent}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Reply input */}
      {!isDraft && (
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          {replyingTo && (
            <View style={styles.replyingBar}>
              <Text style={styles.replyingText} numberOfLines={1}>
                回复 {replyingTo.user?.displayName}: {replyingTo.content}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={styles.replyingClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={replyContent}
              onChangeText={setReplyContent}
              placeholder={replyingTo ? `回复 ${replyingTo.user?.displayName}...` : '输入回复...'}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!replyContent.trim() || isSending) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!replyContent.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.sendText}>发送</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  backText: { fontSize: 22, color: colors.gray[600] },
  topTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[800] },
  draftLabel: { fontSize: 11, color: colors.gray[500] },
  publishBtn: { backgroundColor: colors.primary[500], paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  publishText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  messageList: { padding: 16 },
  noteSection: { borderRadius: 14, padding: 14, marginBottom: 16 },
  noteHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  noteAuthorName: { fontSize: 14, fontWeight: '600', color: colors.gray[800] },
  noteDate: { fontSize: 12, color: colors.gray[400] },
  noteFullTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[800], marginBottom: 6 },
  noteFullContent: { fontSize: 15, color: colors.gray[700], lineHeight: 22 },
  replyRow: { flexDirection: 'row', marginBottom: 16 },
  replyBody: { flex: 1, marginLeft: 10 },
  replyMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  replyAuthor: { fontSize: 13, fontWeight: '600', color: colors.gray[800] },
  replyTime: { fontSize: 11, color: colors.gray[400] },
  quotedReply: { paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: colors.gray[300], marginBottom: 4 },
  quotedAuthor: { fontSize: 11, fontWeight: '600', color: colors.gray[500] },
  quotedContent: { fontSize: 11, color: colors.gray[400] },
  quotedDeleted: { fontSize: 11, color: colors.gray[400], fontStyle: 'italic' },
  replyBubble: { backgroundColor: colors.gray[50], borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.gray[100] },
  replyBubbleMine: { backgroundColor: colors.primary[50], borderColor: colors.primary[100] },
  replyText: { fontSize: 14, color: colors.gray[800], lineHeight: 20 },
  replyActions: { flexDirection: 'row', gap: 16, marginTop: 4 },
  actionText: { fontSize: 12, color: colors.primary[600] },
  editBox: { backgroundColor: colors.gray[50], borderRadius: 12, padding: 10 },
  editInput: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 8, padding: 8, fontSize: 14, backgroundColor: colors.white, minHeight: 60 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  editCancel: { fontSize: 13, color: colors.gray[500] },
  editSave: { fontSize: 13, color: colors.primary[600], fontWeight: '600' },
  inputBar: { borderTopWidth: 1, borderTopColor: colors.gray[200], paddingHorizontal: 12, paddingTop: 8 },
  replyingBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray[50], borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 6 },
  replyingText: { flex: 1, fontSize: 12, color: colors.gray[500] },
  replyingClose: { fontSize: 14, color: colors.gray[400], marginLeft: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  textInput: { flex: 1, borderWidth: 1, borderColor: colors.gray[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: colors.gray[50], maxHeight: 100 },
  sendBtn: { backgroundColor: colors.primary[500], borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  sendText: { color: colors.white, fontSize: 14, fontWeight: '600' },
})
