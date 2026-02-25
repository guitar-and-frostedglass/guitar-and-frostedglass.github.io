import { createNavigationContainerRef } from '@react-navigation/native'

export type RootStackParamList = {
  Login: undefined
  Register: { code?: string } | undefined
  Dashboard: undefined
  NoteThread: { noteId: string }
  Profile: undefined
  Admin: undefined
  CreateNote: undefined
}

export const navigationRef = createNavigationContainerRef<RootStackParamList>()
