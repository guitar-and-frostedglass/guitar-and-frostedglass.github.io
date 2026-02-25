import axios from 'axios'
import { setupApiInterceptors } from '../../../shared/services/api'
import { mobileTokenStorage, mobileNavigation } from '../platform'
import { API_BASE_URL } from '../config'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

setupApiInterceptors(api, mobileTokenStorage, mobileNavigation)

export default api
