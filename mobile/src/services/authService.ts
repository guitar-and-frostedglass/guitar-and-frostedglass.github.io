import { createAuthService } from '../../../shared/services/authService'
import { mobileTokenStorage } from '../platform'
import api from './api'

export const authService = createAuthService(api, mobileTokenStorage)
