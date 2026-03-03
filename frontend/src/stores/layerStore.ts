import { create } from 'zustand'
import type { NoteLayer } from '../../../shared/types'

/** Hidden layer is only accessible between 19:00 and 09:00. */
export function isNightTime(): boolean {
  const h = new Date().getHours()
  return h >= 19 || h < 9
}

interface LayerState {
  currentLayer: NoteLayer
  isHiddenUnlocked: boolean
  showPinModal: boolean

  openPinModal: () => void
  closePinModal: () => void
  unlock: () => void
  lock: () => void
  setLayer: (layer: NoteLayer) => void
  reset: () => void
  /** If currently in HIDDEN and nighttime has ended, auto-lock back. */
  enforceCurfew: () => void
}

export const useLayerStore = create<LayerState>((set, get) => ({
  currentLayer: 'SURFACE',
  isHiddenUnlocked: false,
  showPinModal: false,

  openPinModal: () => set({ showPinModal: true }),
  closePinModal: () => set({ showPinModal: false }),

  unlock: () => set({ isHiddenUnlocked: true, currentLayer: 'HIDDEN', showPinModal: false }),

  lock: () => set({ isHiddenUnlocked: false, currentLayer: 'SURFACE' }),

  setLayer: (layer) => set({ currentLayer: layer }),

  reset: () => set({ currentLayer: 'SURFACE', isHiddenUnlocked: false, showPinModal: false }),

  enforceCurfew: () => {
    if (get().currentLayer === 'HIDDEN' && !isNightTime()) {
      set({ isHiddenUnlocked: false, currentLayer: 'SURFACE', showPinModal: false })
    }
  },
}))
