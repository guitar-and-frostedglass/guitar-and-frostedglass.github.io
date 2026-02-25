import { create } from 'zustand'
import { createAuthStoreSlice } from '../../../shared/stores/authStore'
import type { AuthState } from '../../../shared/stores/authStore'
import { authService } from '../services/authService'

export const useAuthStore = create<AuthState>()(createAuthStoreSlice(authService) as any)

useAuthStore.getState().initAuth()
