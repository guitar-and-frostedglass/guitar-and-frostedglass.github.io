import { createAuthService } from '../../../shared/services/authService'
import { webTokenStorage } from '../platform'
import api from './api'

export const authService = createAuthService(api, webTokenStorage)
