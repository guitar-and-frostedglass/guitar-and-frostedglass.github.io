import { create } from 'zustand'
import type { NoteLayer } from '../../../shared/types'

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
}

export const useLayerStore = create<LayerState>((set) => ({
  currentLayer: 'SURFACE',
  isHiddenUnlocked: false,
  showPinModal: false,

  openPinModal: () => set({ showPinModal: true }),
  closePinModal: () => set({ showPinModal: false }),

  unlock: () => set({ isHiddenUnlocked: true, currentLayer: 'HIDDEN', showPinModal: false }),

  lock: () => set({ isHiddenUnlocked: false, currentLayer: 'SURFACE' }),

  setLayer: (layer) => set({ currentLayer: layer }),

  reset: () => set({ currentLayer: 'SURFACE', isHiddenUnlocked: false, showPinModal: false }),
}))
