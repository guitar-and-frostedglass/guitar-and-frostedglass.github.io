import { create } from 'zustand'
import { createNoteStoreSlice } from '../../../shared/stores/noteStore'
import type { NoteState } from '../../../shared/stores/noteStore'
import { noteService } from '../services/noteService'
import { useAuthStore } from './authStore'
import { mobilePersistStorage } from '../platform'

export const useNoteStore = create<NoteState>()(
  createNoteStoreSlice(
    noteService,
    () => useAuthStore.getState().user?.id ?? null,
    mobilePersistStorage,
  ) as any,
)
